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
    }))
);

export const datasetAvailableSummaryQuery = e.params(
  { limit: e.int32, offset: e.int32 },
  (params) =>
    e.select(e.dataset.Dataset, (ds) => {
      const availBclArtifact = e.select(e.lab.ArtifactBcl, (ab) => ({
        ...ab["*"],
        filter: e.op(
          e.op(ab.bclFile.isAvailable, "=", true),
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
            e.op(afp.forwardFile.isAvailable, "=", true),
            "and",
            e.op(afp.reverseFile.isAvailable, "=", true)
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
            e.op(ab.bamFile.isAvailable, "=", true),
            "and",
            e.op(ab.baiFile.isAvailable, "=", true)
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
            e.op(ac.cramFile.isAvailable, "=", true),
            "and",
            e.op(ac.craiFile.isAvailable, "=", true)
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
            e.op(av.vcfFile.isAvailable, "=", true),
            "and",
            e.op(av.tbiFile.isAvailable, "=", true)
          )
        ),
      }));

      return {
        // get the top level dataset elements
        ...e.dataset.Dataset["*"],
        // compute some useful summary counts
        summaryCaseCount: e.count(ds.cases),
        summaryPatientCount: e.count(ds.cases.patients),
        summarySpecimenCount: e.count(ds.cases.patients.specimens),
        summaryArtifactCount: e.count(ds.cases.patients.specimens.artifacts),
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
