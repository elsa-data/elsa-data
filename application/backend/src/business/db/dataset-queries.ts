import e from "../../../dbschema/edgeql-js";
import { makeSystemlessIdentifierArray } from "./helper";

/**
 * An EdgeDb query for counting datasets.
 */
export const datasetAllCountQuery = e.count(e.dataset.Dataset);

/**
 * A pageable EdgeDb query for all our summary dataset info + counts/calcs. It *does not*
 * however recurse deep into the dataset structures for all the sub cases/patients etc - those
 * query elements need to be added elsewhere
 */
export const datasetSummaryQuery = e.params(
  {
    limit: e.optional(e.int32),
    offset: e.optional(e.int32),
    includeDeletedFile: e.bool,
  },
  (params) =>
    e.select(e.dataset.Dataset, (ds) => {
      const isDeletedFileFilter = params.includeDeletedFile;
      const op = "or";

      const availBclArtifact = e.select(e.lab.ArtifactBcl, (ab) => ({
        ...ab["*"],
        filter: e.op(
          e.op(e.op("not", ab.bclFile.isDeleted), op, isDeletedFileFilter),
          "and",
          e.op(
            ab.id,
            "=",
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBcl).id
          )
        ),
      }));

      const availFastqArtifact = e.select(e.lab.ArtifactFastqPair, (afp) => ({
        ...afp["*"],
        filter: e.op(
          e.op(
            afp.id,
            "=",
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair).id
          ),
          "and",
          e.op(
            e.op(
              e.op("not", afp.forwardFile.isDeleted),
              op,
              isDeletedFileFilter
            ),
            "and",
            e.op(
              e.op("not", afp.reverseFile.isDeleted),
              op,
              isDeletedFileFilter
            )
          )
        ),
      }));

      const availBamArtifact = e.select(e.lab.ArtifactBam, (ab) => ({
        ...ab["*"],
        filter: e.op(
          e.op(
            ab.id,
            "=",
            ds.cases.patients.specimens.artifacts.is(
              ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam)
            ).id
          ),
          "and",
          e.op(
            e.op(e.op("not", ab.bamFile.isDeleted), op, isDeletedFileFilter),
            "and",
            e.op(e.op("not", ab.baiFile.isDeleted), op, isDeletedFileFilter)
          )
        ),
      }));

      const availCramArtifact = e.select(e.lab.ArtifactCram, (ac) => ({
        ...ac["*"],
        filter: e.op(
          e.op(
            ac.id,
            "=",
            ds.cases.patients.specimens.artifacts.is(
              ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram)
            ).id
          ),
          "and",
          e.op(
            e.op(e.op("not", ac.cramFile.isDeleted), op, isDeletedFileFilter),
            "and",
            e.op(e.op("not", ac.craiFile.isDeleted), op, isDeletedFileFilter)
          )
        ),
      }));

      const availVcfArtifact = e.select(e.lab.ArtifactVcf, (av) => ({
        ...av["*"],
        filter: e.op(
          e.op(
            av.id,
            "=",
            ds.cases.patients.specimens.artifacts.is(
              ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf)
            ).id
          ),
          "and",
          e.op(
            e.op(e.op("not", av.vcfFile.isDeleted), op, isDeletedFileFilter),
            "and",
            e.op(e.op("not", av.tbiFile.isDeleted), op, isDeletedFileFilter)
          )
        ),
      }));

      const artifactTotalSum = e.sum(
        e.set(
          e.count(availBclArtifact),
          e.count(availFastqArtifact),
          e.count(availBamArtifact),
          e.count(availCramArtifact),
          e.count(availVcfArtifact)
        )
      );

      return {
        // get the top level dataset elements
        ...e.dataset.Dataset["*"],
        // compute some useful summary counts
        summaryCaseCount: e.count(ds.cases),
        summaryPatientCount: e.count(ds.cases.patients),
        summarySpecimenCount: e.count(ds.cases.patients.specimens),
        summaryArtifactCount: artifactTotalSum,
        summaryBclCount: e.count(availBclArtifact),
        summaryFastqCount: e.count(availFastqArtifact),
        summaryBamCount: e.count(availBamArtifact),
        summaryCramCount: e.count(availCramArtifact),
        summaryVcfCount: e.count(availVcfArtifact),
        // the byte size of all artifacts
        summaryArtifactBytes: e.sum(
          e.set(
            e.sum(availBclArtifact.bclFile.size),
            e.sum(availFastqArtifact.forwardFile.size),
            e.sum(availFastqArtifact.reverseFile.size),
            e.sum(availBamArtifact.bamFile.size),
            e.sum(availBamArtifact.baiFile.size),
            e.sum(availCramArtifact.cramFile.size),
            e.sum(availCramArtifact.craiFile.size),
            e.sum(availVcfArtifact.vcfFile.size),
            e.sum(availVcfArtifact.tbiFile.size)
          )
        ),
        order_by: [
          {
            expression: ds.uri,
            direction: e.ASC,
          },
          {
            expression: ds.id,
            direction: e.ASC,
          },
        ],
        limit: params.limit,
        offset: params.offset,
      };
    })
);

export const selectDatasetPatientByExternalIdentifiersQuery = (exId: string) =>
  e.select(e.dataset.DatasetPatient, (dp) => ({
    filter: e.op(
      dp.externalIdentifiers,
      "=",
      makeSystemlessIdentifierArray(exId)
    ),
  }));

export const selectDatasetCaseByExternalIdentifiersQuery = (exId: string) =>
  e.select(e.dataset.DatasetCase, (dc) => ({
    filter: e.op(
      dc.externalIdentifiers,
      "=",
      makeSystemlessIdentifierArray(exId)
    ),
  }));

export const selectDatasetIdByDatasetUri = (datasetUri: string) =>
  e
    .select(e.dataset.Dataset, (d) => ({
      id: true,
      filter: e.op(d.uri, "ilike", datasetUri),
    }))
    .assert_single();
