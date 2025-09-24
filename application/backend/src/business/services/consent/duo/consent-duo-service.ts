import * as gel from "gel";
import { inject, injectable } from "tsyringe";
import { Compile } from "typebox/compile";
import {
  DUO_DS,
  DUO_GRU,
  DUO_HMB,
  DUO_NRES,
  DUO_POA,
  DuoLimitationSchema,
  DuoModifierSchema,
} from "./duo-schemas.ts";
import type {
  DuoApplicationType,
  DuoLimitationCodedType,
  DuoModifierType,
} from "./duo-types.ts";

export type ConsentDuoContext = {
  now?: Date;
  diseaseIsA?: (
    applicationSystem: string,
    applicationCode: string,
    consentedSystem: string,
    consentedCode: string,
  ) => boolean;
};

@injectable()
export class ConsentDuoService {
  constructor(@inject("Database") private readonly gelDbClient: gel.Client) {}

  private limitationChecker = Compile(DuoLimitationSchema);
  private modifierChecker = Compile(DuoModifierSchema);

  /**
   * For a given chain of specimen->patient->case consent statement sets,
   * compute if consent to release this specimen is given.
   *
   * @param context
   * @param application
   * @param datasetConsents
   * @param caseConsents
   * @param patientConsents
   * @param specimenConsents
   */
  public async applyConsent(
    context: ConsentDuoContext,
    application: DuoApplicationType,
    datasetConsents: DuoLimitationCodedType[],
    caseConsents: DuoLimitationCodedType[],
    patientConsents: DuoLimitationCodedType[],
    specimenConsents: DuoLimitationCodedType[],
  ): Promise<boolean> {
    // our logic is
    // we start with the assumption of no consent
    // start at the most specific element (specimen, patient .. )
    // if *any* consent statement at the element is workable - then consent is given and algorithm stops

    // specimens
    for (const l of specimenConsents) {
      if (await this.testSingleConsentLimitation(context, application, l)) {
        return true;
      }
    }
    // patients
    for (const l of patientConsents) {
      if (await this.testSingleConsentLimitation(context, application, l)) {
        return true;
      }
    }

    // cases
    for (const l of caseConsents) {
      if (await this.testSingleConsentLimitation(context, application, l)) {
        return true;
      }
    }

    // datasets
    for (const l of datasetConsents) {
      if (await this.testSingleConsentLimitation(context, application, l)) {
        return true;
      }
    }

    // if we found no consent statement to release the data then fail consent
    return false;
  }

  private async testSingleConsentLimitation(
    context: ConsentDuoContext,
    application: DuoApplicationType,
    limitation: DuoLimitationCodedType,
  ): Promise<boolean> {
    // the very basic limitation hierarchy testing (this could be done with a
    // terminology service if the DUO hierarchy was more complex)
    // instead we just hand code

    // type check at a data level that this meets our definition of a limitation
    if (!this.limitationChecker.Check(limitation)) return false;

    const doModifierCheck = async () => {
      // it is ok for there to be no modifiers
      if (!limitation.modifiers) return true;

      for (const m of limitation.modifiers) {
        // if *any* modifier is not met then overall consent fails
        if (
          !(await this.testSingleConsentLimitation(
            context,
            application,
            m as any,
          ))
        ) {
          return false;
        }
      }

      // all modifiers succeeded so modifier check is good
      return true;
    };

    // if NRES then the application does not need any research type at all (all are suitable, including no statement of research type)
    if (limitation.code == DUO_NRES) {
      return await doModifierCheck();
    }

    switch (application.researchType) {
      case DUO_DS:
        // if application is for disease and limitation is DS then disease must semantically match
        if (limitation.code == DUO_DS) {
          // do disease check

          // if no terminology lookup is provided then this is an automatic fail
          if (!context.diseaseIsA) return false;

          // if no disease is provided in the application then this is an automatic fail
          if (!application.disease) return false;

          if (
            !context.diseaseIsA(
              limitation.diseaseSystem,
              application.disease,
              limitation.diseaseSystem,
              limitation.diseaseCode,
            )
          )
            return false;
        } else {
          if (limitation.code != DUO_GRU && limitation.code != DUO_HMB) {
            return false;
          }
        }
        break;
      case DUO_HMB:
        if (limitation.code != DUO_GRU && limitation.code != DUO_HMB) {
          return false;
        }
        break;
      case DUO_GRU:
        if (limitation.code != DUO_GRU) {
          return false;
        }
        break;
      case DUO_POA:
        if (limitation.code != DUO_POA) {
          return false;
        }
        break;
      default:
        // an unknown research type means fail if the limitation code is anything other than NRES
        return false;
    }

    // once we have fallen through to here then the primary limitations pass - we just
    // need to check the modifiers
    return await doModifierCheck();
  }

  private async testSingleConsentModifier(
    context: ConsentDuoContext,
    application: DuoApplicationType,
    modifier: DuoModifierType,
  ): Promise<boolean> {
    // type check at a data level that this meets our definition of a modifier
    if (!this.modifierChecker.Check(modifier)) return false;

    return true;
  }
}
