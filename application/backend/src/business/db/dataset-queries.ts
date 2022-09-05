import e from "../../../dbschema/edgeql-js";

/**
 * An EdgeDb query for counting datasets.
 */
export const datasetAllCountQuery = e.count(e.dataset.Dataset);

/**
 * A pageable EdgeDb query for all our summary dataset info + counts/calcs. It *does not*
 * however recurse deep into the dataset structures for all the sub cases/patients etc - those
 * query elements need to be added elsewhere
 */
export const datasetAllSummaryQuery = e.params(
  { limit: e.int32, offset: e.int32 },
  (params) =>
    e.select(e.dataset.Dataset, (ds) => ({
      // get the top level dataset elements
      ...e.dataset.Dataset["*"],
      // compute some useful summary counts
      summaryCaseCount: e.count(ds.cases),
      summaryPatientCount: e.count(ds.cases.patients),
      summarySpecimenCount: e.count(ds.cases.patients.specimens),
      summaryArtifactCount: e.count(ds.cases.patients.specimens.artifacts),
      summaryBclCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBcl),
      ),
      summaryFastqCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair),
      ),
      summaryBamCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam),
      ),
      summaryCramCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram),
      ),
      summaryVcfCount: e.count(
        ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf),
      ),
      // the byte size of all artifacts
      summaryArtifactBytes: e.sum(
        e.set(
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBcl).bclFile
              .size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair)
              .forwardFile.size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactFastqPair)
              .reverseFile.size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam).bamFile
              .size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactBam).baiFile
              .size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram)
              .cramFile.size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactCram)
              .craiFile.size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf).vcfFile
              .size,
          ),
          e.sum(
            ds.cases.patients.specimens.artifacts.is(e.lab.ArtifactVcf).tbiFile
              .size,
          ),
        ),
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
    })),
);
