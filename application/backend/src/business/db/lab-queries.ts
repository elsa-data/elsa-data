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
  return e.insert(e.storage.File, {
    url: file.url,
    size: file.size,
    checksums: file.checksums,
  });
}

export function insertArtifactFastqPairQuery(
  forwardFile: File,
  reverseFile: File
) {
  return e.insert(e.lab.ArtifactFastqPair, {
    forwardFile: insertFile(forwardFile),
    reverseFile: insertFile(reverseFile),
  });
}

export function insertArtifactBamQuery(bamFile: File, baiFile: File) {
  return e.insert(e.lab.ArtifactBam, {
    bamFile: insertFile(bamFile),
    baiFile: insertFile(baiFile),
  });
}

export function insertArtifactVcfQuery(vcfFile: File, tbiFile: File) {
  return e.insert(e.lab.ArtifactVcf, {
    vcfFile: insertFile(vcfFile),
    tbiFile: insertFile(tbiFile),
  });
}

export function insertArtifactCramQuery(cramFile: File, craiFile: File) {
  return e.insert(e.lab.ArtifactCram, {
    cramFile: insertFile(cramFile),
    craiFile: insertFile(craiFile),
  });
}

/**
 * SELECT function queries
 */
export const fastqArtifactStudyIdAndFileIdByDatasetCaseIdQuery = e.params(
  { datasetCaseId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactFastqPair, (fastqArtifact) => {
      // const vcfForwardFileQuery = e.select(e.storage.File, (file) => ({
      //   url: true,
      //   filter: e.op(file.id, "=", fastqArtifact.forwardFile.id),
      // }));
      // const vcfReverseFileQuery = e.select(e.storage.File, (file) => ({
      //   url: true,
      //   filter: e.op(file.id, "=", fastqArtifact.reverseFile.id),
      // }));
      return {
        // fileId: e.set(vcfForwardFileQuery, vcfReverseFileQuery),
        fileIdList: e.set(
          fastqArtifact.forwardFile.id,
          fastqArtifact.reverseFile.id
        ),
        studyIdList:
          fastqArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          fastqArtifact["<artifacts[is dataset::DatasetSpecimen]"].case_.id,
          "=",
          params.datasetCaseId
        ),
      };
    })
);

export const bamArtifactStudyIdAndFileIdByDatasetCaseIdQuery = e.params(
  { datasetCaseId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactBam, (bamArtifact) => {
      return {
        fileIdList: e.set(bamArtifact.bamFile.id, bamArtifact.baiFile.id),
        studyIdList:
          bamArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          bamArtifact["<artifacts[is dataset::DatasetSpecimen]"].case_.id,
          "=",
          params.datasetCaseId
        ),
      };
    })
);

export const cramArtifactStudyIdAndFileIdByDatasetCaseIdQuery = e.params(
  { datasetCaseId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactCram, (cramArtifact) => {
      return {
        fileIdList: e.set(cramArtifact.craiFile.id, cramArtifact.craiFile.id),
        studyIdList:
          cramArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          cramArtifact["<artifacts[is dataset::DatasetSpecimen]"].case_.id,
          "=",
          params.datasetCaseId
        ),
      };
    })
);

export const vcfArtifactStudyIdAndFileIdByDatasetCaseIdQuery = e.params(
  { datasetCaseId: e.uuid },
  (params) =>
    e.select(e.lab.ArtifactVcf, (vcfArtifact) => {
      return {
        fileIdList: e.set(vcfArtifact.vcfFile.id, vcfArtifact.tbiFile.id),
        studyIdList:
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].case_.id,
          "=",
          params.datasetCaseId
        ),
      };
    })
);
