import axios from "axios";
import type { ConsenterCtrlType } from "../../config/config-schema-consenter.ts";
import {
  DUO_DS,
  DUO_GRU,
  DUO_HMB,
  DUO_NCU,
  DUO_NRES,
  DUO_POA,
} from "./consent/duo/duo-schemas.ts";
import type {
  DuoLimitationCodedType,
  DuoModifierType,
} from "./consent/duo/duo-types.ts";

/**
 * Fetch CTRL dynamic consent information for a particular
 * patient and consenter. Return the consent
 * information structured as a proper DUO code. Return
 * null if there was no information
 *
 * @param consenter
 * @param consentSystemIdentifier
 * @private
 */
export async function fetchCtrlConsent(
  consenter: ConsenterCtrlType,
  consentSystemIdentifier: string,
) {
  const resp = await axios.post<any>(
    consenter.url,
    {
      participantIds: [consentSystemIdentifier],
    },
    {
      headers: {
        Authorization: consenter.authorizationHeaderValue,
      },
    },
  );

  // this.logger.debug(
  //  {
  //    url: consenter.url,
  //    responseStatus: resp.statusText,
  //    responseData: resp.data,
  //  },
  //  "Dynamic consent HTTP POST",
  //);

  // this will be each patient that they had a record for... in our case we only asked for
  // one patient so will be either 0 or 1
  for (const ctrlMatch of resp.data?.data ?? []) {
    if (ctrlMatch.participantId !== consentSystemIdentifier)
      throw new Error(
        `Consent logic ended up with participantId of ${ctrlMatch.participantId} mismatched to identifier ${consentSystemIdentifier}`,
      );

    const ctrlDuoCodes = ctrlMatch?.duos ?? [];

    // if there are no DUOS in the response then we fall through
    // effectively this means that they are _not_ consented to anything
    if (!ctrlDuoCodes) continue;
    if (ctrlDuoCodes.length < 1) continue;

    // for dynamic consent - we allow the CTRL engine to provide family/dataset etc
    // statements. So all we need to do is decode the patient consents we
    // get back and pass them into the engine
    let patientLimitation: DuoLimitationCodedType | undefined = undefined;
    const modifiers: DuoModifierType[] = [];

    // first we loop through looking for a base limitation
    for (const code of ctrlDuoCodes) {
      if (code.startsWith("SNOMED:")) {
        // we have an agreement to translate SNOMED on behalf of CTRL into DS
        if (patientLimitation) {
          // we will allow the case where we "upgrade" a HMB to a DS
          if (patientLimitation.code !== DUO_HMB)
            throw new Error(
              "More than one base limitation was expressed by CTRL for a single patient",
            );
        }
        patientLimitation = {
          code: DUO_DS,
          diseaseSystem: "http://snomed.info/sct",
          diseaseCode: code.slice("SNOMED:".length),
          modifiers: [],
        };
      } else {
        switch (code) {
          case DUO_GRU:
          case DUO_POA:
          case DUO_NRES:
            if (patientLimitation)
              throw new Error(
                "More than one base limitation was expressed by CTRL for a single patient",
              );
            patientLimitation = {
              code: code,
              modifiers: [],
            };
            break;
          case DUO_HMB:
            if (patientLimitation) {
              // we will allow the case in which we have already declared a DS - in which case we fall through
              // and don't change anything
              if (patientLimitation.code !== DUO_DS)
                throw new Error(
                  "More than one base limitation was expressed by CTRL for a single patient",
                );
            } else {
              patientLimitation = {
                code: code,
                modifiers: [],
              };
            }
            break;
          case DUO_NCU:
            modifiers.push({
              code: code,
            });
            break;
          default:
            throw new Error(`Unknown code ${code}`);
        }
      }
    }

    if (!patientLimitation)
      throw new Error(
        "No base limitation was found for CTRL for a single patient",
      );

    patientLimitation.modifiers = modifiers;

    return patientLimitation;
  }

  return null;
}
