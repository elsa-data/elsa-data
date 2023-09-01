import { org } from "../../../generated/phenopackets";
import { isEmpty } from "lodash";

/**
 * Given content as a Buffer, test the content for validity and if
 * suitable return as a decoded Phenopacket object. If not a valid phenopacket
 * object, return null.
 *
 * @param content
 */
export async function resolveContentToPhenopacket(
  content: Buffer
): Promise<
  | org.phenopackets.schema.v2.Phenopacket
  | org.phenopackets.schema.v2.Family
  | org.phenopackets.schema.v2.Cohort
  | null
> {
  const contentString = content.toString("utf-8");

  // NOTE the decode protobuf objects have arrays (albeit empty) - even where there was no data
  // present - so we need to always be careful what sort of "is null" etc tests we are making -
  // so mainly we use lodash

  try {
    const jsonParsed = JSON.parse(contentString);

    try {
      const pp = org.phenopackets.schema.v2.Phenopacket.fromObject(jsonParsed);

      // FROM Java implementation
      // // Top-level fields unique to a phenopacket, both v1 and v2. If we see this field, the content must be a phenopacket.
      //     private static final List<String> PHENOPACKET_FIELDS = List.of(
      //             "subject", "phenotypicFeatures", "measurements", "interpretations", "medicalActions",
      //             "biosamples", "genes", "variants", "diseases"
      //     );
      if (
        !isEmpty(pp.subject) ||
        !isEmpty(pp.phenotypicFeatures) ||
        !isEmpty(pp.measurements) ||
        !isEmpty(pp.interpretations) ||
        !isEmpty(pp.medicalActions) ||
        !isEmpty(pp.biosamples) ||
        !isEmpty(pp.diseases)
      ) {
        // console.log("INDIVIDUAL");
        // console.log(JSON.stringify(pp.toJSON()));
        return pp;
      }
    } catch (ex) {}

    try {
      const pf = org.phenopackets.schema.v2.Family.fromObject(jsonParsed);

      if (
        !isEmpty(pf.proband) ||
        !isEmpty(pf.relatives) ||
        !isEmpty(pf.pedigree)
      ) {
        // console.log("FAMILY");
        // console.log(JSON.stringify(pf.toJSON()));
        return pf;
      }
    } catch (ex) {}

    try {
      const pc = org.phenopackets.schema.v2.Cohort.fromObject(jsonParsed);

      if (!isEmpty(pc.description) || !isEmpty(pc.members)) {
        return pc;
      }
    } catch (ex) {}
  } catch (e) {}

  return null;
}

try {
} catch (e) {}
