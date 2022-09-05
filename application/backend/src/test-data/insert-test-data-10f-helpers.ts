import {
  createArtifacts,
  File,
  IdentifierMap,
  makeDictionaryIdentifierArray,
} from "./test-data-helpers";
import e from "../../dbschema/edgeql-js";
import { DuoLimitationCodedType } from "@umccr/elsa-types";

export const TENF_URI = "urn:fdc:umccr.org:2022:dataset/10f";

export const GIAB_FAMILY_SYSTEM = "giabfamily";

export const NIST_BIOSAMPLE_SYSTEM = "http://www.ncbi.nlm.nih.gov/biosample";

export const CORIELL_CELL_SYSTEM = "coriellcell";
export const CORIELL_DNA_SYSTEM = "corielldna";
export const CORIELL_FAMILY_SYSTEM = "coriellfamily";

export const PGP_SYSTEM = "https://my.pgp-hms.org";
export const THOUSAND_GENOMES_SYSTEM = "1KGP";

function consentsAsInsertOrUndefined(consents: DuoLimitationCodedType[]) {
  if (!consents || consents.length <= 0) return undefined;

  const duoInserts = consents.map((c) =>
    e.insert(e.consent.ConsentStatementDuo, { dataUseLimitation: c })
  );

  return e.insert(e.consent.Consent, {
    statements: e.set(...duoInserts),
  });
}

export async function makeTrio(
  familyId: IdentifierMap,
  familyConsents: DuoLimitationCodedType[],
  probandPatientId: IdentifierMap,
  probandSpecimenId: IdentifierMap,
  probandSex: "male" | "female" | "other",
  probandVcf: [File, File],
  probandBam: [File, File],
  probandConsents: DuoLimitationCodedType[],
  probandSpecimenConsents: DuoLimitationCodedType[],
  fatherPatientId: IdentifierMap,
  fatherSpecimenId: IdentifierMap,
  fatherVcf: [File, File],
  fatherBam: [File, File],
  fatherConsents: DuoLimitationCodedType[],
  fatherSpecimenConsents: DuoLimitationCodedType[],
  motherPatientId: IdentifierMap,
  motherSpecimenId: IdentifierMap,
  motherVcf: [File, File],
  motherBam: [File, File],
  motherConsents: DuoLimitationCodedType[],
  motherSpecimenConsents: DuoLimitationCodedType[]
) {
  return e.insert(e.dataset.DatasetCase, {
    externalIdentifiers: makeDictionaryIdentifierArray(familyId),
    consent: consentsAsInsertOrUndefined(familyConsents),
    patients: e.set(
      e.insert(e.dataset.DatasetPatient, {
        sexAtBirth: probandSex,
        externalIdentifiers: makeDictionaryIdentifierArray(probandPatientId),
        consent: consentsAsInsertOrUndefined(probandConsents),
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeDictionaryIdentifierArray(probandSpecimenId),
          consent: consentsAsInsertOrUndefined(probandSpecimenConsents),
          artifacts: await createArtifacts(
            probandVcf[0],
            probandVcf[1],
            probandBam[0],
            probandBam[1],
            []
          ),
        }),
      }),
      e.insert(e.dataset.DatasetPatient, {
        sexAtBirth: "male",
        externalIdentifiers: makeDictionaryIdentifierArray(fatherPatientId),
        consent: consentsAsInsertOrUndefined(fatherConsents),
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeDictionaryIdentifierArray(fatherSpecimenId),
          consent: consentsAsInsertOrUndefined(fatherSpecimenConsents),
          artifacts: await createArtifacts(
            fatherVcf[0],
            fatherVcf[1],
            fatherBam[0],
            fatherBam[1],
            []
          ),
        }),
      }),
      e.insert(e.dataset.DatasetPatient, {
        sexAtBirth: "female",
        externalIdentifiers: makeDictionaryIdentifierArray(motherPatientId),
        consent: consentsAsInsertOrUndefined(motherConsents),
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeDictionaryIdentifierArray(motherSpecimenId),
          consent: consentsAsInsertOrUndefined(motherSpecimenConsents),
          artifacts: await createArtifacts(
            motherVcf[0],
            motherVcf[1],
            motherBam[0],
            motherBam[1],
            []
          ),
        }),
      })
    ),
  });
}
