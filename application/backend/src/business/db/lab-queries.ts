import e, { storage } from "../../../dbschema/edgeql-js";

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
