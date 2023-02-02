import * as edgedb from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";
import {
  createArtifacts,
  makeSystemlessIdentifierArray,
  createFile,
} from "./test-data-helpers";
import { DuoLimitationCodedType } from "@umccr/elsa-types";
import { container } from "tsyringe";
import { ElsaSettings } from "../config/elsa-settings";

const edgeDbClient = edgedb.createClient();

export const TENG_URI = "urn:fdc:umccr.org:2022:dataset/10g";

/**
 * The 10G dataset is a subset of the 1000 genomes data but artificially put into a structure
 * to test specific areas of data sharing.
 */
export async function insert10G(ownerEmail?: string[]) {
  const settings = container.resolve<ElsaSettings>("Settings");

  const makeCase = async (
    caseId: string,
    patientId: string,
    patientSexAtBirth: "male" | "female" | "other",
    specimenId: string,
    bamSize: number,
    bamEtag: string,
    bamMd5: string,
    vcfSize: number,
    vcfEtag: string,
    vcfMd5: string,
    patientConsentJsons?: DuoLimitationCodedType[],
    specimenConsentJsons?: DuoLimitationCodedType[]
  ) => {
    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeSystemlessIdentifierArray(caseId),
      patients: e.insert(e.dataset.DatasetPatient, {
        sexAtBirth: patientSexAtBirth,
        externalIdentifiers: makeSystemlessIdentifierArray(patientId),
        consent:
          patientConsentJsons && patientConsentJsons.length > 0
            ? e.insert(e.consent.Consent, {
                statements: e.set(
                  ...patientConsentJsons.map((pc) =>
                    e.insert(e.consent.ConsentStatementDuo, {
                      dataUseLimitation: pc,
                    })
                  )
                ),
              })
            : undefined,
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeSystemlessIdentifierArray(specimenId),
          consent:
            specimenConsentJsons && specimenConsentJsons.length > 0
              ? e.insert(e.consent.Consent, {
                  statements: e.set(
                    ...specimenConsentJsons.map((sc) =>
                      e.insert(e.consent.ConsentStatementDuo, {
                        dataUseLimitation: sc,
                      })
                    )
                  ),
                })
              : undefined,
          artifacts: await createArtifacts(
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz`,
              vcfSize,
              vcfEtag,
              vcfMd5
            ),
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz.tbi`,
              0
            ),
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.bam`,
              bamSize,
              bamEtag,
              bamMd5
            ),
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.bam.bai`,
              0
            ),
            [],
            []
          ),
        }),
      }),
    });
  };

  return await e
    .insert(e.dataset.Dataset, {
      uri: TENG_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("10G"),
      description: "UMCCR 10G",
      dataOwnerEmailArray: ownerEmail,
      cases: e.set(
        await makeCase(
          "SINGLETONCHARLES",
          "CHARLES",
          "male",
          "HG00096",
          51808533335,
          "bfce3cfa4f0265866fae8f7a653cca95-3089", // pragma: allowlist secret
          "63f2b3c6b87c66d114f1e9bae8c35091", // pragma: allowlist secret
          425745911,
          "19dca923f52f14af83d410983e46284f-26", // pragma: allowlist secret
          "54c76df2f55aa5a2450bd874bf488100", // pragma: allowlist secret
          [{ code: "DUO:0000006", modifiers: [{ code: "DUO:0000045" }] }]
        ),
        await makeCase(
          "SINGLETONMARY",
          "MARY",
          "female",
          "HG00097",
          51388476731,
          "06b1c646338fa079dd6d7cb5f9dd67ed-3063", // pragma: allowlist secret
          "a6e072e3831fbdad4b790b9655d03301", // pragma: allowlist secret
          432160352,
          "3194220a4ba859ceaa6b8bd7f7db5e14-26", // pragma: allowlist secret
          "e16865d5a227ff6af6f09ca535db5d92", // pragma: allowlist secret
          [{ code: "DUO:0000006", modifiers: [] }],
          [
            {
              code: "DUO:0000007",
              // endocrine system disorder
              diseaseSystem: settings.mondoSystem.uri,
              diseaseCode: "MONDO:0005151",
              modifiers: [{ code: "DUO:0000045" }],
            },
          ]
        ),
        await makeCase(
          "SINGLETONJANE",
          "JANE",
          "female",
          "HG00099",
          60287609330,
          "7f2c808df51490657f374b9d50abf6b1-3594", // pragma: allowlist secret
          "8335ad513b0c22f32d558302448e69c8", // pragma: allowlist secret
          438966719,
          "3724127aaee9ca1a94f9b70d67e67a29-27", // pragma: allowlist secret
          "48c5e1a3e232d4f0f86dc7d5573ee092" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONKAARINA",
          "KAARINA",
          "female",
          "HG00171",
          58384944597,
          "5d825ddd05da504698dbeb23d15362a7-6961", // pragma: allowlist secret
          "63510a8e2239cf249ca09713a91a6424", // pragma: allowlist secret
          437251295,
          "df373fd8c2d17baabe3ee589c0326fb9-27", // pragma: allowlist secret
          "9797c64d48fa174fea3b01347e26a308" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONANNELI",
          "ANNELI",
          "female",
          "HG00173",
          48040087199,
          "c61c0622eabbc405f06a789cf6ba8fd6-2864", // pragma: allowlist secret
          "c74d331165fe3f38cc761f2a0722ba72", // pragma: allowlist secret
          429780695,
          "7d05309c6f6844d905c31be28586a982-26", // pragma: allowlist secret
          "efbb3a684951c627b82cbd66e84f55c1" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONMARIA",
          "MARIA",
          "female",
          "HG00174",
          54237781415,
          "6d7b24a88ef68599a2e0313210b6378c-3233", // pragma: allowlist secret
          "45d0cf732bab4a511a32107740b35a07", // pragma: allowlist secret
          434759056,
          "f47ab95a47264f62de13f5365b83eb64-26", // pragma: allowlist secret
          "be6558787eb497fe2574d3c994e320f9" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONMELE",
          "MELE",
          "male",
          "HG01810",
          50762049781,
          "80cbbe8fef18d6aeb340f04295c73478-3026", // pragma: allowlist secret
          "cb7e8611d76ceca501692bd0eafb659d", // pragma: allowlist secret
          419758367,
          "7d735cd64a1117d1b862ff3228d7a6e2-26", // pragma: allowlist secret
          "7917729eda54199c49195c0673692e22" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONPELANI",
          "PELANI",
          "male",
          "HG01811",
          50858843268,
          "fc762747742fc6d7c6957570a174585f-3032", // pragma: allowlist secret
          "42cb60acce8b87487dbc4be04029d140", // pragma: allowlist secret
          419339818,
          "b257163c3eade1afb78f8bce4d6c89df-25", // pragma: allowlist secret
          "49de7148a89194b1f706c510a7d1e9e7" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONDEMBO",
          "DEMBO",
          "male",
          "HG03432",
          55219679614,
          "c7d2c93155e292acd0a7fdb5c56d83bf-6583", // pragma: allowlist secret
          "d2d47067e22360ebcc7a7eb0c4211f0f", // pragma: allowlist secret
          534880969,
          "ae99529fbdfcf1e399e6f7060b2b691e-32", // pragma: allowlist secret
          "f8777c671b63974c3c0f1f167a57a36d" // pragma: allowlist secret
        ),
        await makeCase(
          "SINGLETONPAKUTEH",
          "PAKUTEH",
          "male",
          "HG03433",
          60896676023,
          "7947dd1c25329b90e9cf45372714bbeb-3630", // pragma: allowlist secret
          "65a66f7b1fa663a6c4660e42fb11baf6", // pragma: allowlist secret
          540694003,
          "cde09b0694f3cd5cfd014a7500cfc0e9-33", // pragma: allowlist secret
          "bb80404412db614f2e6a7b9b49ab5977" // pragma: allowlist secret
        )
      ),
    })
    .run(edgeDbClient);
}
