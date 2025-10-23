import {
  InvocationType,
  InvokeCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import AmazonS3URI from "amazon-s3-uri";
import axios from "axios";
import * as gel from "gel";
import _ from "lodash";
import Papa from "papaparse";
import type { Logger } from "pino";
import { inject, injectable } from "tsyringe";
import type { dataset, release } from "../../../dbschema/interfaces";
import type { ConsenterCtrlType } from "../../config/config-schema-consenter.ts";
import type { ElsaSettings } from "../../config/elsa-settings.ts";
import {
  type ConsentDuoContext,
  ConsentDuoService,
} from "./consent/duo/consent-duo-service.ts";
import type {
  DuoApplicationType,
  DuoLimitationCodedType,
} from "./consent/duo/duo-types.ts";
import { collapseExternalIds } from "./helpers.ts";

@injectable()
export class SelectService {
  constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Logger") private readonly logger: Logger,
    @inject("Database") private readonly gelDbClient: gel.Client,
    @inject(ConsentDuoService)
    private readonly consentDuoService: ConsentDuoService,
  ) {}

  /**
   * For a given chain of specimen->patient->case decide if the specimen should
   * be selected for the release.
   *
   * @param applicationContext
   * @param vcf
   * @param vcfIndex
   * @param caseContext
   * @param patientContext
   * @param specimenContext
   */
  public async isSelectable(
    applicationContext: release.ApplicationCoded,
    vcf: string | undefined,
    vcfIndex: string | undefined,
    caseContext: dataset.DatasetCase,
    patientContext: dataset.DatasetPatient,
    specimenContext: dataset.DatasetSpecimen,
  ): Promise<boolean> {
    // note this logic still needs to be generalised... but will work for datasets
    // set up for our demonstration projects

    // because dynamic consent overrules any other static info - it runs
    // first by itself
    for (const statement of patientContext.consent?.statements ?? []) {
      if ("consentSystemIdentifier" in statement) {
        const csi = statement.consentSystemIdentifier as
          | string
          | null
          | undefined;

        if (csi) {
          return await this.applyPatientDynamicConsent(csi);
        } else {
          // if they have a dynamic consent statement but no identifier then we
          // need to say they are not consented
          return false;
        }
      }
    }

    const caseLimitations = (caseContext.consent?.statements ?? []).filter(
      (c) => "dataUseLimitation" in c,
    );
    const patientLimitations = (
      patientContext.consent?.statements ?? []
    ).filter((c) => "dataUseLimitation" in c);
    const specimenLimitations = (
      specimenContext.consent?.statements ?? []
    ).filter((c) => "dataUseLimitation" in c);

    return true;

    // this.consentDuoService.applyConsent()

    // A Beacon query demo
    // if (applicationContext.beaconQuery && vcf && vcfIndex) {
    //  return await this.beaconSelect(applicationContext.beaconQuery as string, vcf, vcfIndex, caseContext, patientContext, specimenContext);
    //
    //}
    const population = await axios
      .get<string>(
        "https://ftp.1000genomes.ebi.ac.uk/vol1/ftp/data_collections/1000G_2504_high_coverage/20130606_g1k_3202_samples_ped_population.txt",
      )
      .then((a) => a.data)
      .then((data) =>
        Papa.parse(data, {
          header: true,
          delimiter: " ",
          skipEmptyLines: "greedy",
        }),
      );

    // for 1000 genome lookup we are using only specimen ids (all the other ids we made up ourselves)
    const specimenId = collapseExternalIds(specimenContext.externalIdentifiers);
    let result = false;

    for (const p of population.data) {
      if ((p as any)["SampleID"] === specimenId) {
        for (const country of applicationContext.countriesInvolved ?? []) {
          if (country.code === (p as any)["Superpopulation"]) {
            result = true;
          }
        }
      }
    }

    return result;
  }

  /**
   * Once we identify that a patient belongs to a dynamic consent
   * provider - we ask it for consent info and then run the algorithm.
   * The result of this single dynamic check applies for all this
   * patients specimens - and does not consult any consent information
   * at a case or dataset level (as this is done by the dynamic consent
   * system).
   *
   * @param consentSystemIdentifier
   * @private
   */
  private async applyPatientDynamicConsent(consentSystemIdentifier: string) {
    const context: ConsentDuoContext = {
      now: new Date(),
    };

    const app: DuoApplicationType = {
      researchType: "DUO:0000007",

      // researchers
      // institutions
      // countries
      // disease
    };

    // we need to find a consenter of type ctrl (at the moment assuming
    // there is only one) - will need to find the "right" one via some
    // flag in the dataset in the future
    const ctrlConsenters = this.settings.consenters.filter(
      (s) => s.type === "ctrl",
    ) as ConsenterCtrlType[];

    if (ctrlConsenters && ctrlConsenters.length > 0) {
      const r = await axios
        .post<any>(
          ctrlConsenters[0].url,
          {
            participantIds: [consentSystemIdentifier],
          },
          {
            headers: {
              Authorization: ctrlConsenters[0].authorizationHeaderValue,
            },
          },
        )
        .then((a) => a.data);

      // this will be each patient that they had a record for... in our case we only asked for
      // one patient so will be either 0 or 1
      for (const d of r?.data ?? []) {
        // for dynamic consent - we allow the CTRL engine to provide family/dataset etc
        // statements. So all we need to do is decode the patient consents we
        // get back and pass them into the engine
        const patientLimitations: DuoLimitationCodedType[] = [];

        for (const code of d?.duos ?? []) {
          switch (code) {
            case "DUO:0000002":
              patientLimitations.push({
                code: "DUO:0000042",
                modifiers: [],
              });
              break;
            default:
              break;
          }
        }

        if (d.participantId === consentSystemIdentifier) {
          return await this.consentDuoService.applyConsent(
            context,
            app,
            [],
            [],
            patientLimitations,
            [],
          );
        }
      }
    }

    return false;
  }

  /**
   * Apply any specified Beacon v2 filters. Currently limited in scope
   * so definitely WIP.
   *
   * @param filters
   * @param caseContext
   * @param patientContext
   * @param specimenContext
   * @private
   */
  private beaconFilters(
    filters: any[],
    caseContext: dataset.DatasetCase,
    patientContext: dataset.DatasetPatient,
    specimenContext: dataset.DatasetSpecimen,
  ): boolean {
    for (const filter of filters) {
      // the only filter we currently implement is basic sex
      if (filter.scope === "individuals")
        if (filter.id === "sex" || filter.id === "SNOMED:1515311000168102") {
          switch (filter.operator) {
            case "=":
              if (filter.value !== patientContext.sexAtBirth) return false;
              break;
            case "!=":
              if (filter.value === patientContext.sexAtBirth) return false;
              break;
            default:
              // if we don't recognise the operator default to failing the filter
              return false;
          }
        }
    }

    return true;
  }

  private async beaconSelect(
    beaconQuery: any,
    vcf: string,
    vcfIndex: string,
    caseContext: dataset.DatasetCase,
    patientContext: dataset.DatasetPatient,
    specimenContext: dataset.DatasetSpecimen,
  ) {
    const filters = beaconQuery.filters;
    const requestParameters = beaconQuery.requestParameters;

    let beaconGenotypeAllowed = true;
    let beaconFilterAllowed = true;

    if (_.isArray(filters)) {
      beaconFilterAllowed = this.beaconFilters(
        filters,
        caseContext,
        patientContext,
        specimenContext,
      );
    }

    if (_.isPlainObject(requestParameters)) {
      if (_.isPlainObject(requestParameters.g_variant)) {
        const lambdaClient = new LambdaClient({});

        const { bucket: vcfBucket, key: vcfKey } = AmazonS3URI(vcf);
        const { bucket: vcfIndexBucket, key: vcfIndexKey } =
          AmazonS3URI(vcfIndex);

        // map into our lambda parameters - at the moment this is a direct
        // map but could be more complex in the future
        // if JSON schema isn't done prior to this - then consider extra error
        // checking here
        const genotypeQuery = {
          vcf_bucket: vcfBucket,
          vcf_key: vcfKey,
          vcf_index_bucket: vcfIndexBucket,
          vcf_index_key: vcfIndexKey,
          reference_name: requestParameters.g_variant.referenceName,
          start: requestParameters.g_variant.start,
          reference_bases: requestParameters.g_variant.referenceBases,
          alternate_bases: requestParameters.g_variant.alternateBases,
        };

        // TODO: this will not be a static AWS lambda name (if indeed it is a lambda at all)

        const beaconResult = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: "elsa-data-beacon",
            Payload: Buffer.from(JSON.stringify(genotypeQuery), "utf8"),
            InvocationType: InvocationType.RequestResponse,
          }),
        );

        if (beaconResult.StatusCode === 200 && beaconResult.Payload) {
          const beaconResultParsed = JSON.parse(
            Buffer.from(beaconResult.Payload).toString(),
          );
          beaconGenotypeAllowed = !!beaconResultParsed.found;
        } else {
          // if our lambda invoke fails then we assume the VCF is not allowed
          beaconGenotypeAllowed = false;

          if (beaconResult.FunctionError)
            console.log(beaconResult.FunctionError);
        }
      }
    }

    return beaconGenotypeAllowed && beaconFilterAllowed;
  }
}
