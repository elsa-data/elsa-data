import e, { storage } from "../../../dbschema/edgeql-js";

export enum ArtifactType {
  FASTQ = "FASTQ",
  BAM = "BAM",
  CRAM = "CRAM",
  VCF = "VCF",
}

export type File = {
  size: number;
  url: string;
  checksums: {
    type: storage.ChecksumType;
    value: string;
  }[];
};

function insertFile(file: File) {
  return e
    .insert(e.storage.File, {
      url: file.url,
      size: file.size,
      checksums: file.checksums,
      isDeleted: false,
    })
    .unlessConflict((file) => ({
      on: file.url,
      else: file,
    }));
}

export function insertArtifactFastqPairQuery(
  forwardFile: File,
  reverseFile: File,
  sampleIds: string[]
) {
  return e.insert(e.lab.ArtifactFastqPair, {
    sampleIds: sampleIds,
    forwardFile: insertFile(forwardFile),
    reverseFile: insertFile(reverseFile),
  });
}

export function insertArtifactBamQuery(
  bamFile: File,
  baiFile: File,
  sampleIds: string[]
) {
  return e.insert(e.lab.ArtifactBam, {
    sampleIds: sampleIds,
    bamFile: insertFile(bamFile),
    baiFile: insertFile(baiFile),
  });
}

export function insertArtifactVcfQuery(
  vcfFile: File,
  tbiFile: File,
  sampleIds: string[]
) {
  return e.insert(e.lab.ArtifactVcf, {
    sampleIds: sampleIds,
    vcfFile: insertFile(vcfFile),
    tbiFile: insertFile(tbiFile),
  });
}

export function insertArtifactCramQuery(
  cramFile: File,
  craiFile: File,
  sampleIds: string[]
) {
  return e.insert(e.lab.ArtifactCram, {
    sampleIds: sampleIds,
    cramFile: insertFile(cramFile),
    craiFile: insertFile(craiFile),
  });
}

/**
 * SELECT function queries
 */
export const fastqArtifactStudyIdAndFileIdByDatasetIdQuery = e.params(
  { datasetId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactFastqPair, (fastqArtifact) => {
      return {
        fileIdList: e.set(
          fastqArtifact.forwardFile.id,
          fastqArtifact.reverseFile.id
        ),
        studyIdList:
          fastqArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          fastqArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.id,
          "=",
          params.datasetId
        ),
      };
    })
);

export const bamArtifactStudyIdAndFileIdByDatasetIdQuery = e.params(
  { datasetId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactBam, (bamArtifact) => {
      return {
        fileIdList: e.set(bamArtifact.bamFile.id, bamArtifact.baiFile.id),
        studyIdList:
          bamArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          bamArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.id,
          "=",
          params.datasetId
        ),
      };
    })
);

export const cramArtifactStudyIdAndFileIdByDatasetIdQuery = e.params(
  { datasetId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactCram, (cramArtifact) => {
      return {
        fileIdList: e.set(cramArtifact.craiFile.id, cramArtifact.craiFile.id),
        studyIdList:
          cramArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          cramArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.id,
          "=",
          params.datasetId
        ),
      };
    })
);

export const vcfArtifactStudyIdAndFileIdByDatasetIdQuery = e.params(
  { datasetId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactVcf, (vcfArtifact) => {
      return {
        fileIdList: e.set(vcfArtifact.vcfFile.id, vcfArtifact.tbiFile.id),
        studyIdList:
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.id,
          "=",
          params.datasetId
        ),
      };
    })
);

/**
 * For a given specimen - return the pairs of vcf/index (if any)
 */
export const vcfArtifactUrlsBySpecimenQuery = e.params(
  { specimenId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactVcf, (vcfArtifact) => {
      return {
        vcfs: e.tuple([vcfArtifact.vcfFile.url, vcfArtifact.tbiFile.url]),
        filter: e.op(
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].id,
          "=",
          params.specimenId
        ),
      };
    })
);
