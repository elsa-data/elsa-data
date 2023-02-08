import { on } from "node:events";
import e from "../../../dbschema/edgeql-js";
import { makeSystemlessIdentifierArray } from "./helper";

/**
 * An EdgeDb query for counting datasets.
 */
export const datasetAllCountQuery = e.count(e.select(e.dataset.Dataset));

/**
 * Some Artifact query based on specified datasets
 */
const artifactDatasetQuery = (ds: any, isDeletedFileFilter: any) => {
  const availBclArtifact = e.select(e.lab.ArtifactBcl, (ab) => ({
    ...ab["*"],
    filter: e.op(
      e.op(e.op("not", ab.bclFile.isDeleted), "or", isDeletedFileFilter),
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
        e.op(e.op("not", afp.forwardFile.isDeleted), "or", isDeletedFileFilter),
        "and",
        e.op(e.op("not", afp.reverseFile.isDeleted), "or", isDeletedFileFilter)
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
        e.op(e.op("not", ab.bamFile.isDeleted), "or", isDeletedFileFilter),
        "and",
        e.op(e.op("not", ab.baiFile.isDeleted), "or", isDeletedFileFilter)
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
        e.op(e.op("not", ac.cramFile.isDeleted), "or", isDeletedFileFilter),
        "and",
        e.op(e.op("not", ac.craiFile.isDeleted), "or", isDeletedFileFilter)
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
        e.op(e.op("not", av.vcfFile.isDeleted), "or", isDeletedFileFilter),
        "and",
        e.op(e.op("not", av.tbiFile.isDeleted), "or", isDeletedFileFilter)
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
    availBclArtifact,
    availFastqArtifact,
    availBamArtifact,
    availCramArtifact,
    availVcfArtifact,
    artifactTotalSum,
  };
};

/**
 * A pageable EdgeDb query for all our summary dataset info + counts/calcs. It *does not*
 * however recurse deep into the dataset structures for all the sub cases/patients etc - those
 * query elements need to be added elsewhere
 */
export const datasetAllSummaryQuery = e.params(
  {
    limit: e.optional(e.int32),
    offset: e.optional(e.int32),
    includeDeletedFile: e.bool,
  },
  (params) =>
    e.select(e.dataset.Dataset, (ds) => {
      const isDeletedFileFilter = params.includeDeletedFile;

      const artifactDataset = artifactDatasetQuery(ds, isDeletedFileFilter);

      return {
        // get the top level dataset elements
        ...e.dataset.Dataset["*"],
        // compute some useful summary counts
        summaryCaseCount: e.count(ds.cases),
        summaryPatientCount: e.count(ds.cases.patients),
        summarySpecimenCount: e.count(ds.cases.patients.specimens),
        summaryArtifactCount: artifactDataset.artifactTotalSum,
        summaryBclCount: e.count(artifactDataset.availBclArtifact),
        summaryFastqCount: e.count(artifactDataset.availFastqArtifact),
        summaryBamCount: e.count(artifactDataset.availBamArtifact),
        summaryCramCount: e.count(artifactDataset.availCramArtifact),
        summaryVcfCount: e.count(artifactDataset.availVcfArtifact),
        // the byte size of all artifacts
        summaryArtifactBytes: e.sum(
          e.set(
            e.sum(artifactDataset.availBclArtifact.bclFile.size),
            e.sum(artifactDataset.availFastqArtifact.forwardFile.size),
            e.sum(artifactDataset.availFastqArtifact.reverseFile.size),
            e.sum(artifactDataset.availBamArtifact.bamFile.size),
            e.sum(artifactDataset.availBamArtifact.baiFile.size),
            e.sum(artifactDataset.availCramArtifact.cramFile.size),
            e.sum(artifactDataset.availCramArtifact.craiFile.size),
            e.sum(artifactDataset.availVcfArtifact.vcfFile.size),
            e.sum(artifactDataset.availVcfArtifact.tbiFile.size)
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

export const singleDatasetSummaryQuery = e.params(
  {
    datasetId: e.uuid,
    includeDeletedFile: e.bool,
  },
  (params) =>
    e
      .select(e.dataset.Dataset, (ds) => {
        const isDeletedFileFilter = params.includeDeletedFile;

        const artifactDataset = artifactDatasetQuery(ds, isDeletedFileFilter);

        return {
          // get the top level dataset elements
          ...e.dataset.Dataset["*"],
          // compute some useful summary counts
          summaryCaseCount: e.count(ds.cases),
          summaryPatientCount: e.count(ds.cases.patients),
          summarySpecimenCount: e.count(ds.cases.patients.specimens),
          summaryArtifactCount: artifactDataset.artifactTotalSum,
          summaryBclCount: e.count(artifactDataset.availBclArtifact),
          summaryFastqCount: e.count(artifactDataset.availFastqArtifact),
          summaryBamCount: e.count(artifactDataset.availBamArtifact),
          summaryCramCount: e.count(artifactDataset.availCramArtifact),
          summaryVcfCount: e.count(artifactDataset.availVcfArtifact),
          // the byte size of all artifacts
          summaryArtifactBytes: e.sum(
            e.set(
              e.sum(artifactDataset.availBclArtifact.bclFile.size),
              e.sum(artifactDataset.availFastqArtifact.forwardFile.size),
              e.sum(artifactDataset.availFastqArtifact.reverseFile.size),
              e.sum(artifactDataset.availBamArtifact.bamFile.size),
              e.sum(artifactDataset.availBamArtifact.baiFile.size),
              e.sum(artifactDataset.availCramArtifact.cramFile.size),
              e.sum(artifactDataset.availCramArtifact.craiFile.size),
              e.sum(artifactDataset.availVcfArtifact.vcfFile.size),
              e.sum(artifactDataset.availVcfArtifact.tbiFile.size)
            )
          ),
          cases: {
            consent: {
              id: true,
            },
            externalIdentifiers: true,
            patients: {
              sexAtBirth: true,
              consent: {
                id: true,
              },
              externalIdentifiers: true,
              specimens: {
                externalIdentifiers: true,
              },
            },
          },
          filter: e.op(params.datasetId, "=", ds.id),
        };
      })
      .assert_single()
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

export const selectOrUpsertDataset = ({
  datasetUri,
  datasetDescription,
  datasetName,
}: {
  datasetUri: string;
  datasetDescription: string;
  datasetName: string;
}) =>
  e
    .insert(e.dataset.Dataset, {
      uri: datasetUri,
      externalIdentifiers: makeSystemlessIdentifierArray(datasetName),
      description: datasetDescription,
    })
    .unlessConflict((dataset) => ({
      on: dataset.uri,
      else: e.update(dataset, () => ({
        set: {
          externalIdentifiers: makeSystemlessIdentifierArray(datasetName),
          description: datasetDescription,
        },
      })),
    }));
