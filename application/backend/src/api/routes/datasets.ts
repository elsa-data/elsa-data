import { FastifyInstance } from "fastify";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import {
  DatasetDeepType,
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncRequestType,
  DatasetGen3SyncResponseType,
  DatasetLightType,
  DuoLimitationSchema,
} from "@umccr/elsa-types";
import { ElsaSettings } from "../../bootstrap-settings";

import addFormats from "ajv-formats";
import Ajv from "ajv/dist/2019";

const ajv = addFormats(new Ajv({}), [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
])
  .addKeyword("kind")
  .addKeyword("modifier");

const gen3SyncRequestValidate = ajv.compile(DatasetGen3SyncRequestSchema);

const client = edgedb.createClient();

export function registerDatasetsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets",
    {},
    async function (request, reply) {
      const fullDatasets = await e
        .select(e.dataset.Dataset, (r) => ({
          ...e.dataset.Dataset["*"],
          summaryCaseCount: e.count(r.cases),
          summaryPatientCount: e.count(r.cases.patients),
          summarySpecimenCount: e.count(r.cases.patients.specimens),
          summaryArtifactCount: e.count(r.cases.patients.specimens.artifacts),
          summaryArtifactBytes: e.sum(
            r.cases.patients.specimens.artifacts.size
          ),
          bamsCount: e.count(
            r.cases.patients.specimens.artifacts.is(e.lab.AnalysesArtifactBam)
          ),
          vcfsCount: e.count(
            r.cases.patients.specimens.artifacts.is(e.lab.AnalysesArtifactVcf)
          ),
          fastqsCount: e.count(
            r.cases.patients.specimens.artifacts.is(e.lab.RunArtifactFastqPair)
          ),
        }))
        .run(client);

      const converted: DatasetLightType[] = fullDatasets.map((fd) => {
        const includes: string[] = [];
        if (fd.bamsCount > 0) includes.push("BAM");
        if (fd.fastqsCount > 0) includes.push("FASTQ");
        if (fd.vcfsCount > 0) includes.push("VCF");
        return {
          id: fd.id,
          uri: fd.uri!,
          description: fd.description,
          summaryPatientCount: fd.summaryPatientCount,
          summarySpecimenCount: fd.summarySpecimenCount,
          summaryArtifactCount: fd.summaryArtifactCount,
          summaryArtifactIncludes: includes.join(" "),
          summaryArtifactSizeBytes: fd.summaryArtifactBytes,
        };
      });

      reply.send(converted);
    }
  );

  fastify.get<{ Params: { did: string }; Reply: DatasetDeepType }>(
    "/api/datasets/:did",
    {},
    async function (request, reply) {
      const elsaSettings: ElsaSettings = (request as any).settings;

      const datasetId = request.params.did;

      const singleDataset = await e
        .select(e.dataset.Dataset, (ds) => ({
          ...e.dataset.Dataset["*"],
          summaryArtifactBytes: e.sum(
            ds.cases.patients.specimens.artifacts.size
          ),
          cases: {
            externalIdentifiers: true,
            patients: {
              externalIdentifiers: true,
              specimens: {
                externalIdentifiers: true,
                artifacts: {
                  id: true,
                  url: true,
                  size: true,
                },
              },
            },
          },
          filter: e.op(ds.id, "=", e.uuid(datasetId)),
        }))
        .run(client);

      if (singleDataset != null)
        reply.send({
          id: singleDataset.id,
          uri: singleDataset.uri,
          cases: singleDataset.cases.map((c) => {
            return {
              patients: c.patients.map((p) => {
                return {
                  specimens: p.specimens.map((s) => {
                    return {
                      artifacts: s.artifacts.map((a) => {
                        return {
                          location: a.url,
                          size: a.size,
                          type: "BAMFASTQVCF",
                        };
                      }),
                    };
                  }),
                };
              }),
            };
          }),
        });
    }
  );

  fastify.post<{
    Request: DatasetGen3SyncRequestType;
    Reply: DatasetGen3SyncResponseType;
  }>("/api/datasets", {}, async function (request, reply) {
    if (!gen3SyncRequestValidate(request.body)) {
      reply.send({
        error: gen3SyncRequestValidate.errors,
      });
    }

    reply.send({
      error: undefined,
    });
  });
}
