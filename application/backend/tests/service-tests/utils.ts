import { Client } from "edgedb";
import { makeSystemlessIdentifier } from "../../src/test-data/test-data-helpers";
import e from "../../dbschema/edgeql-js";
import {
  ReleaseCaseType,
  ReleasePatientType,
  ReleaseSpecimenType,
} from "@umccr/elsa-types";

export async function findDatabaseRelease(client: Client, releaseId: string) {
  const res = await e
    .select(e.release.Release, (r) => ({
      ...e.release.Release["*"],
      applicationCoded: {
        ...e.release.ApplicationCoded["*"],
      },
      filter: e.op(r.id, "=", e.uuid(releaseId)),
    }))
    .assert_single()
    .run(client);

  if (res) return res;
  else throw new Error(`Release id ${releaseId} does not exist in database`);
}

/**
 * Given a set of systemless id values - return the specimen ids of all matching
 * specimens from the database.
 * NOTE: this assumes that there aren't common ids across datasets - which is
 * an ok assumption for our test data but is not an assumption you'd make in the real world.
 *
 * @param client
 * @param valueIds
 */
export async function findDatabaseSpecimenIds(
  client: Client,
  valueIds: string[]
): Promise<string[]> {
  const toChange = await e
    .select(e.dataset.DatasetSpecimen, (dss) => ({
      filter: e.op(
        e.set(...valueIds),
        "in",
        e.array_unpack(dss.externalIdentifiers).value
      ),
    }))
    .run(client);

  return toChange.map((a) => a.id);
}

/**
 * Given a set of system less id values - return the patient ids of all matching
 * patients from the database.
 *
 * @param client
 * @param valueIds
 */
export async function findDatabasePatientIds(
  client: Client,
  valueIds: string[]
): Promise<string[]> {
  const toChange = await e
    .select(e.dataset.DatasetPatient, (dp) => ({
      filter: e.op(
        e.set(...valueIds.map((a) => makeSystemlessIdentifier(a))),
        "in",
        e.array_unpack(dp.externalIdentifiers)
      ),
    }))
    .run(client);

  return toChange.map((a) => a.id);
}

/**
 * Given a set of system less id values - return the cases ids of all matching
 * cases from the database.
 *
 * @param client
 * @param valueIds
 */
export async function findDatabaseCaseIds(
  client: Client,
  valueIds: string[]
): Promise<string[]> {
  const toChange = await e
    .select(e.dataset.DatasetCase, (dp) => ({
      filter: e.op(
        e.set(...valueIds.map((a) => makeSystemlessIdentifier(a))),
        "in",
        e.array_unpack(dp.externalIdentifiers)
      ),
    }))
    .run(client);

  return toChange.map((a) => a.id);
}

export function findSpecimen(
  cases: ReleaseCaseType[],
  externalId: string
): ReleaseSpecimenType | null {
  for (const c of cases || []) {
    for (const p of c.patients || []) {
      for (const s of p.specimens || []) {
        if (s.externalId === externalId) return s;
      }
    }
  }
  return null;
}

export function findPatient(
  cases: ReleaseCaseType[],
  externalId: string
): ReleasePatientType | null {
  for (const c of cases || []) {
    for (const p of c.patients || []) {
      if (p.externalId === externalId) return p;
    }
  }
  return null;
}

export function findPatientExpected(
  cases: ReleaseCaseType[],
  externalId: string
) {
  const v = findPatient(cases, externalId);
  if (!v)
    throw new Error(`Could not find an expected patient with id ${externalId}`);
  return v;
}

export function findCase(
  cases: ReleaseCaseType[],
  externalId: string
): ReleaseCaseType | null {
  for (const c of cases || []) {
    if (c.externalId === externalId) return c;
  }
  return null;
}
