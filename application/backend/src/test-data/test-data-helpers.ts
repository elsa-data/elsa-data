import { createClient } from "edgedb";
import e, { lab, storage } from "../../dbschema/edgeql-js";

const edgeDbClient = createClient();

export function makeDictionaryIdentifierArray(dict: { [k: string]: string }) {
  const asArrayEntries = Array.from(
    Object.entries(dict).map((ent) => ({ system: ent[0], value: ent[1] }))
  );

  const tupleArrayType = e.array(e.tuple({ system: e.str, value: e.str }));

  return e.cast(tupleArrayType, e.literal(tupleArrayType, asArrayEntries));
}

export function makeSystemlessIdentifier(entry1: string) {
  return e.tuple({ system: "", value: entry1 });
}

export function makeIdentifierTuple(system: string, value: string) {
  return e.tuple({ system: system, value: value });
}

/**
 * Make an identifier array (array of tuples) where there is only
 * one entry and it is an identifier with value only (no system)
 *
 * @param entry1
 */
export function makeSystemlessIdentifierArray(entry1: string) {
  return e.array([makeSystemlessIdentifier(entry1)]);
}

/**
 * Make an identifier array (array of tuples) that is empty.
 */
export function makeEmptyIdentifierArray() {
  const tupleArrayType = e.array(e.tuple({ system: e.str, value: e.str }));

  return e.cast(tupleArrayType, e.literal(tupleArrayType, []));
}

/**
 * Make a code array (array of tuples) that is empty.
 */
export function makeEmptyCodeArray() {
  const tupleArrayType = e.array(e.tuple({ system: e.str, code: e.str }));

  return e.cast(tupleArrayType, e.literal(tupleArrayType, []));
}

/**
 * Make a code array - rewrite for typescript varargs at some point
 */
export function makeSingleCodeArray(system: string, code: string) {
  return e.array([e.tuple({ system: system, code: code })]);
}

export function makeDoubleCodeArray(
  system1: string,
  code1: string,
  system2: string,
  code2: string
) {
  return e.array([
    e.tuple({ system: system1, code: code1 }),
    e.tuple({ system: system2, code: code2 }),
  ]);
}

export function makeTripleCodeArray(
  system1: string,
  code1: string,
  system2: string,
  code2: string,
  system3: string,
  code3: string
) {
  return e.array([
    e.tuple({ system: system1, code: code1 }),
    e.tuple({ system: system2, code: code2 }),
    e.tuple({ system: system3, code: code3 }),
  ]);
}

/**
 * Create a user for testing purposes.
 *
 * @param subjectId
 * @param displayName
 * @param releasesAsDataOwner
 * @param releasesAsPI
 * @param releasesAsMember
 */
export async function createTestUser(
  subjectId: string,
  displayName: string,
  releasesAsDataOwner: string[],
  releasesAsPI: string[],
  releasesAsMember: string[]
) {
  // create the user
  const newUser = await e
    .insert(e.permission.User, {
      subjectId: subjectId,
      displayName: displayName,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
      allowedImportDataset: false,
    })
    .run(edgeDbClient);

  // a helper to update the role this users has with a release
  const insertRole = async (
    releaseId: string,
    role: "DataOwner" | "PI" | "Member"
  ) => {
    await e
      .update(e.permission.User, (user) => ({
        filter: e.op(e.uuid(newUser.id), "=", user.id),
        set: {
          releaseParticipant: {
            "+=": e.select(e.release.Release, (r) => ({
              filter: e.op(e.uuid(releaseId), "=", r.id),
              "@role": e.str(role),
            })),
          },
        },
      }))
      .run(edgeDbClient);
  };

  for (const dataOwnerReleaseId of releasesAsDataOwner) {
    await insertRole(dataOwnerReleaseId, "DataOwner");
  }

  for (const piReleaseId of releasesAsPI) {
    await insertRole(piReleaseId, "PI");
  }

  for (const memberReleaseId of releasesAsMember) {
    await insertRole(memberReleaseId, "Member");
  }
}

/**
 * Create a blank dataset for testing purposes (we sometimes want
 * to create lots of datasets just for testing paging algorithms/load etc)
 *
 * @param id
 * @param uri
 */
export async function insertBlankDataset(id: string, uri: string) {
  return await e
    .insert(e.dataset.Dataset, {
      uri: uri,
      externalIdentifiers: makeSystemlessIdentifierArray(id),
      description: `Madeup blank dataset ${id}`,
      cases: e.set(),
    })
    .run(edgeDbClient);
}

export function findCase(id: string) {
  return e
    .select(e.dataset.DatasetCase, (dp) => ({
      filter: e.op(
        id,
        "in",
        e.set(e.array_unpack(dp.externalIdentifiers).value)
      ),
    }))
    .assert_single();
}

export function findPatient(id: string) {
  return e
    .select(e.dataset.DatasetPatient, (dp) => ({
      filter: e.op(
        id,
        "in",
        e.set(e.array_unpack(dp.externalIdentifiers).value)
      ),
    }))
    .assert_single();
}

export function findSpecimenQuery(id: string) {
  return e
    .select(e.dataset.DatasetSpecimen, (dp) => ({
      filter: e.op(
        id,
        "in",
        e.set(e.array_unpack(dp.externalIdentifiers).value)
      ),
    }))
    .assert_single();
}

/**
 * Create a File entry
 *
 * @param name
 * @param size
 * @param etag
 * @param md5
 * @param sha1
 * @param sha256
 */
export function createFile(
  name: string,
  size: number,
  etag?: string,
  md5?: string,
  sha1?: string,
  sha256?: string
): File {
  const f: File = {
    url: name,
    size: size,
    checksums: [],
  };

  if (etag) {
    f.checksums.push({
      type: "AWS_ETAG" as storage.ChecksumType,
      value: etag,
    });
  }

  if (md5) {
    f.checksums.push({
      type: storage.ChecksumType.MD5,
      value: md5,
    });
  }

  if (sha1) {
    f.checksums.push({
      type: "SHA_1" as storage.ChecksumType,
      value: sha1,
    });
  }

  if (sha256) {
    f.checksums.push({
      type: "SHA_256" as storage.ChecksumType,
      value: sha256,
    });
  }

  // if we haven't managed to make a checksum - for the purposes of test data lets make a fake MD5
  if (f.checksums.length === 0) {
    f.checksums.push({
      type: storage.ChecksumType.MD5,
      value: "721970cb30906405d4045f702ca72376", // pragma: allowlist secret
    });
  }

  return f;
}

export interface File {
  size: number;
  url: string;
  checksums: {
    type: storage.ChecksumType;
    value: string;
  }[];
}

/**
 * Insert artifacts where each has their own pseudo run and analyses
 * and then return a e.set of all of the things inserted.
 *
 * @param vcf
 * @param vcfIndex
 * @param bam
 * @param bamIndex
 * @param fastqs
 */
export async function createArtifacts(
  vcf: File,
  vcfIndex: File,
  bam: File,
  bamIndex: File,
  fastqs: File[][]
) {
  const fastqPair = fastqs.map((fq) =>
    e.insert(e.lab.ArtifactFastqPair, {
      forwardFile: e.insert(e.storage.File, {
        url: fq[0].url,
        size: fq[0].size,
        checksums: fq[0].checksums,
      }),
      reverseFile: e.insert(e.storage.File, {
        url: fq[1].url,
        size: fq[1].size,
        checksums: fq[1].checksums,
      }),
    })
  );

  // we insert all the fastq pairs as if they are owned by a pseudo-run
  const r1 = await e
    .insert(e.lab.Run, {
      artifactsProduced: e.set(...fastqPair),
    })
    .run(edgeDbClient);

  const r1select = e.select(e.lab.Run.artifactsProduced, (ab) => ({
    filter: e.op(e.uuid(r1.id), "=", ab["<artifactsProduced[is lab::Run]"].id),
  }));

  // we insert all the bams as owned by a pseudo-analysis
  const a1 = await e
    .insert(e.lab.Analyses, {
      pipeline: "A pipeline",
      input: r1select,
      output: e.set(
        e.insert(e.lab.ArtifactVcf, {
          vcfFile: e.insert(e.storage.File, {
            url: vcf.url,
            size: vcf.size,
            checksums: vcf.checksums,
          }),
          tbiFile: e.insert(e.storage.File, {
            url: vcfIndex.url,
            size: vcfIndex.size,
            checksums: vcfIndex.checksums,
          }),
        }),
        e.insert(e.lab.ArtifactBam, {
          bamFile: e.insert(e.storage.File, {
            url: bam.url,
            size: bam.size,
            checksums: bam.checksums,
          }),
          baiFile: e.insert(e.storage.File, {
            url: bamIndex.url,
            size: bamIndex.size,
            checksums: bamIndex.checksums,
          }),
        })
      ),
    })
    .run(edgeDbClient);

  const a1select = e.select(e.lab.Analyses.output, (ab) => ({
    filter: e.op(e.uuid(a1.id), "=", ab["<output[is lab::Analyses]"].id),
  }));

  return e.op(r1select, "union", a1select);
}

export type IdentifierMap = { [system: string]: string };
export type ChecksumMap = {
  [ct in storage.ChecksumType]: string;
};
