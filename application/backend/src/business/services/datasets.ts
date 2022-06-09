import * as edgedb from "edgedb";
import e, { permission } from "../../../dbschema/edgeql-js";
import { DatasetDeepType, DatasetLightType } from "@umccr/elsa-types";
import { AuthUser } from "../../auth/auth-user";

class DatasetsService {
  private edgeDbClient = edgedb.createClient();

  /**
   * Returns a base edgedb query for our dataset info + counts/calcs. It *does not*
   * however recurse deep into the dataset structures for all the sub cases/patients etc - those
   * query elements need to be added elsewhere
   */
  private baseDatasetSelect(limit: number, offset: number) {
    return e.select(e.dataset.Dataset, (ds) => ({
      // get the top level dataset elements
      ...e.dataset.Dataset["*"],
      // compute some useful summary counts
      summaryCaseCount: e.count(ds.cases),
      summaryPatientCount: e.count(ds.cases.patients),
      summarySpecimenCount: e.count(ds.cases.patients.specimens),
      summaryArtifactCount: e.count(ds.cases.patients.specimens.artifacts),
      summaryBclCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBcl)
      ),
      summaryFastqCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair)
      ),
      summaryBamCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam)
      ),
      summaryCramCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram)
      ),
      summaryVcfCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf)
      ),
      // the byte size of all artifacts
      summaryArtifactBytes: e.sum(
        e.set(
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBcl).bclFile
              .size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair)
              .forwardFile.size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair)
              .reverseFile.size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam).bamFile
              .size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam).baiFile
              .size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram)
              .cramFile.size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram)
              .craiFile.size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf).vcfFile
              .size
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf).tbiFile
              .size
          )
        )
      ),
      limit: e.int32(limit),
      offset: e.int32(offset),
      //filter: e.op(ds, "in", e.set(user.datasetOwner))
    }));
  }

  public async getAll(user: AuthUser, limit: number, offset: number) {
    const fullDatasets = await this.baseDatasetSelect(limit, offset).run(
      this.edgeDbClient
    );

    const converted: DatasetLightType[] = fullDatasets.map((fd) => {
      const includes: string[] = [];
      if (fd.summaryBamCount > 0) includes.push("BAM");
      if (fd.summaryFastqCount > 0) includes.push("FASTQ");
      if (fd.summaryVcfCount > 0) includes.push("VCF");
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

    return converted;
  }

  public async get(
    user: AuthUser,
    datasetId: string
  ): Promise<DatasetDeepType | null> {
    const singleDataset = await e
      .select(e.dataset.Dataset, (ds) => ({
        ...e.dataset.Dataset["*"],
        summaryArtifactBytes: e.int16(0),
        //e.sum(
        //  ds.cases.patients.specimens.artifacts.is(e.lab.AnalysesArtifactBase).
        //),
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
      .run(this.edgeDbClient);

    if (singleDataset != null)
      return {
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
      };

    return null;
  }
}

export const datasetsService = new DatasetsService();
