import e, { storage } from "../../../dbschema/edgeql-js";
import { uuid } from "../../../dbschema/edgeql-js/modules/std";

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

export function insertArtifactFastqPairQuery(
  forwardFile: File,
  reverseFileFile: File
) {
  return e.insert(e.lab.ArtifactFastqPair, {
    forwardFile: e.insert(e.storage.File, {
      url: forwardFile.url,
      size: forwardFile.size,
      checksums: forwardFile.checksums,
    }),
    reverseFile: e.insert(e.storage.File, {
      url: reverseFileFile.url,
      size: reverseFileFile.size,
      checksums: reverseFileFile.checksums,
    }),
  });
}

export function insertArtifactBamQuery(bamFile: File, baiFile: File) {
  return e.insert(e.lab.ArtifactBam, {
    bamFile: e.insert(e.storage.File, {
      url: bamFile.url,
      size: bamFile.size,
      checksums: bamFile.checksums,
    }),
    baiFile: e.insert(e.storage.File, {
      url: baiFile.url,
      size: baiFile.size,
      checksums: baiFile.checksums,
    }),
  });
}

export function insertArtifactVcfQuery(vcfFile: File, tbiFile: File) {
  return e.insert(e.lab.ArtifactVcf, {
    vcfFile: e.insert(e.storage.File, {
      url: vcfFile.url,
      size: vcfFile.size,
      checksums: vcfFile.checksums,
    }),
    tbiFile: e.insert(e.storage.File, {
      url: tbiFile.url,
      size: tbiFile.size,
      checksums: tbiFile.checksums,
    }),
  });
}

export function insertArtifactCramQuery(cramFile: File, craiFile: File) {
  return e.insert(e.lab.ArtifactCram, {
    cramFile: e.insert(e.storage.File, {
      url: cramFile.url,
      size: cramFile.size,
      checksums: cramFile.checksums,
    }),
    craiFile: e.insert(e.storage.File, {
      url: craiFile.url,
      size: craiFile.size,
      checksums: craiFile.checksums,
    }),
  });
}

/**
 * SELECT function queries
 */
export type ArtifactStudyIdAndFileIdByDatasetUriQueryType = {
  fileIdList: number[];
  studyIdList: { system: string; value: string }[][];
};
export const fastqArtifactStudyIdAndFileIdByDatasetUriQuery = e.params(
  { datasetUri: e.str },
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
          fastqArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.uri,
          "=",
          params.datasetUri
        ),
      };
    })
);

export const bamArtifactStudyIdAndFileIdByDatasetUriQuery = e.params(
  { datasetUri: e.str },
  (params) =>
    e.select(e.lab.ArtifactBam, (bamArtifact) => {
      return {
        fileIdList: e.set(bamArtifact.bamFile.id, bamArtifact.baiFile.id),
        studyIdList:
          bamArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          bamArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.uri,
          "=",
          params.datasetUri
        ),
      };
    })
);

export const cramArtifactStudyIdAndFileIdByDatasetUriQuery = e.params(
  { datasetUri: e.str },
  (params) =>
    e.select(e.lab.ArtifactCram, (cramArtifact) => {
      return {
        fileIdList: e.set(cramArtifact.craiFile.id, cramArtifact.craiFile.id),
        studyIdList:
          cramArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          cramArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.uri,
          "=",
          params.datasetUri
        ),
      };
    })
);

export const vcfArtifactStudyIdAndFileIdByDatasetUriQuery = e.params(
  { datasetUri: e.str },
  (params) =>
    e.select(e.lab.ArtifactVcf, (vcfArtifact) => {
      return {
        fileIdList: e.set(vcfArtifact.vcfFile.id, vcfArtifact.tbiFile.id),
        studyIdList:
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].patient
            .externalIdentifiers,
        filter: e.op(
          vcfArtifact["<artifacts[is dataset::DatasetSpecimen]"].dataset.uri,
          "=",
          params.datasetUri
        ),
      };
    })
);

export const fileByFileIdQuery = e.params({ uuid: e.uuid }, (params) =>
  e.select(e.storage.File, (file) => ({
    ...e.storage.File["*"],
    filter: e.op(file.id, "=", params.uuid),
  }))
);

export const fileByUrlQuery = e.params({ url: e.str }, (params) =>
  e.select(e.storage.File, (file) => ({
    ...e.storage.File["*"],
    filter: e.op(file.url, "ilike", params.url),
  }))
);
