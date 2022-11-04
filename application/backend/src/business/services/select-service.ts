import * as edgedb from "edgedb";
import { dataset, release } from "../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import {
  InvocationType,
  InvokeCommand,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import AmazonS3URI from "amazon-s3-uri";
import _ from "lodash";

@injectable()
export class SelectService {
  constructor(@inject("Database") private edgeDbClient: edgedb.Client) {}

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
    specimenContext: dataset.DatasetSpecimen
  ): Promise<boolean> {
    let beaconGenotypeAllowed = true;
    let beaconFilterAllowed = true;

    if (applicationContext.beaconQuery && vcf && vcfIndex) {
      const filters = (applicationContext.beaconQuery as any).filters;
      const requestParameters = (applicationContext.beaconQuery as any)
        .requestParameters;

      if (_.isArray(filters)) {
        beaconFilterAllowed = this.beaconFilters(
          filters,
          caseContext,
          patientContext,
          specimenContext
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
            })
          );

          if (beaconResult.StatusCode === 200 && beaconResult.Payload) {
            const beaconResultParsed = JSON.parse(
              Buffer.from(beaconResult.Payload).toString()
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
    }

    return beaconGenotypeAllowed && beaconFilterAllowed;
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
    specimenContext: dataset.DatasetSpecimen
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
}
