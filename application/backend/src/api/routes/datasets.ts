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
import { datasetGen3SyncRequestValidate } from "../../validators/validate-json";

const client = edgedb.createClient();

/**
 * Returns a base edgedb query for our dataset info + counts/calcs. It *does not*
 * however recurse deep into the dataset structures for all the sub cases/patients etc - those
 * query elements need to be added elsewhere
 */
function baseDatasetSelect() {
  return e.select(e.dataset.Dataset, (r) => ({
    ...e.dataset.Dataset["*"],
    summaryCaseCount: e.count(r.cases),
    summaryPatientCount: e.count(r.cases.patients),
    summarySpecimenCount: e.count(r.cases.patients.specimens),
    summaryArtifactCount: e.count(r.cases.patients.specimens.artifacts),
    summaryArtifactBytes: e.sum(r.cases.patients.specimens.artifacts.size),
    bamsCount: e.count(
      r.cases.patients.specimens.artifacts.is(e.lab.AnalysesArtifactBam)
    ),
    vcfsCount: e.count(
      r.cases.patients.specimens.artifacts.is(e.lab.AnalysesArtifactVcf)
    ),
    fastqsCount: e.count(
      r.cases.patients.specimens.artifacts.is(e.lab.RunArtifactFastqPair)
    ),
  }));
}

export function registerDatasetsRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets",
    {},
    async function (request, reply) {
      const fullDatasets = await baseDatasetSelect().run(client);

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
          description: singleDataset.description,
          summaryArtifactCount: 0,
          summaryArtifactIncludes: "",
          summarySpecimenCount: 0,
          summaryPatientCount: 0,
          summaryArtifactSizeBytes: 0,
          cases: singleDataset.cases.map((c) => {
            return {
              patients: c.patients.map((p) => {
                return {
                  specimens: p.specimens.map((s) => {
                    return {
                      artifacts: [],
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
    if (!datasetGen3SyncRequestValidate(request.body)) {
      //reply
      //    .code(200)
      //    .header('Content-Type', 'application/json; charset=utf-8')
      //    .send({ hello: 'world' })

      reply.send({
        error: datasetGen3SyncRequestValidate.errors?.join(" "),
      });
    }

    reply.send({
      error: undefined,
    });
  });
}
