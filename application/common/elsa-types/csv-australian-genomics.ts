// these are the raw CSV fields out of the AG redcap
// NOTE: we are not doing type/schema checking against this - this is the
// theoretical output - but be very careful about using values without checking validity

export const AG_CARDIAC_FLAGSHIP =
  "urn:fdc:australiangenomics.org.au:2022:dataset/cardiac";
export const AG_MACKENZIES_MISSION_FLAGSHIP =
  "urn:fdc:australiangenomics.org.au:2022:dataset/mm";
export const AG_HIDDEN_FLAGSHIP =
  "urn:fdc:australiangenomics.org.au:2022:dataset/hidden";

/**
 * Return the selected dataset URIs from a given AG Redcap DAC export.

 * @param ag the JSON/CSV of a single entry from the export
 */
export function australianGenomicsDacRedcapToDatasetUris(
  ag: AustraliaGenomicsDacRedcap
): string[] {
  const results: string[] = [];

  // a temporary map that allows us to trial Redcap exports against our test datasets
  // these datasets are otherwise unmapped so we haven't lost anything by doing this
  if (ag.daf_flagships_rd___nmd === "1")
    results.push("urn:fdc:umccr.org:2022:dataset/10g");
  if (ag.daf_flagships_rd___renal === "1")
    results.push("urn:fdc:umccr.org:2022:dataset/10f");
  if (ag.daf_flagships_cancer___somatic === "1")
    results.push("urn:fdc:umccr.org:2022:dataset/10c");

  if (ag.daf_flagships_genpop___mm === "1")
    results.push(AG_MACKENZIES_MISSION_FLAGSHIP);

  if (ag.daf_flagships_rd___cardio === "1") results.push(AG_CARDIAC_FLAGSHIP);

  if (ag.daf_flagships_rd___hidden === "1") results.push(AG_HIDDEN_FLAGSHIP);

  if (ag.daf_flagships_cancer___all === "1")
    throw new Error("Flagship ALL has not yet been assigned an identifier");
  if (ag.daf_flagships_cancer___iccon === "1")
    throw new Error("Flagship ICCON has not yet been assigned an identifier");
  if (ag.daf_flagships_cancer___lung === "1")
    throw new Error("Flagship LUNG has not yet been assigned an identifier");

  if (ag.daf_flagships_rd___ac === "1")
    throw new Error("Flagship AC has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___bm === "1")
    throw new Error("Flagship BM has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___ee === "1")
    throw new Error("Flagship EE has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___gi === "1")
    throw new Error("Flagship GI has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___id === "1")
    throw new Error("Flagship ID has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___leuko === "1")
    throw new Error("Flagship LEUKO has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___lung === "1")
    throw new Error("Flagship LUNG has not yet been assigned an identifier");
  if (ag.daf_flagships_rd___mito === "1")
    throw new Error("Flagship MITO has not yet been assigned an identifier");

  return results;
}

export function australianGenomicsDacRedcapToDuoString(
  ag: AustraliaGenomicsDacRedcap
): "GRU" | "HMB" | "CC" | "POA" | "DS" {
  if (ag.daf_type_research___case_ctrl === "1") return "CC";
  if (ag.daf_type_research___disease === "1") return "DS";
  if (ag.daf_type_research___hmb === "1") return "HMB";
  if (ag.daf_type_research___poa === "1") return "POA";
  if (ag.daf_type_research___method_dev === "1")
    throw new Error("No Method Dev");
  if (ag.daf_type_research___other === "1") throw new Error("No Other yet");
  if (ag.daf_type_research___popn_stud === "1")
    throw new Error("No Pop stud yet");
}

/**
 * The CSV fields exported from the Australian Genomics Redcap DAC
 */
export interface AustraliaGenomicsDacRedcap {
  // Application number
  daf_num: string; //"2";

  // Application date
  application_date_hid: string; // "23/4/2021";

  // Project Title
  daf_project_title: string; //"Test project 2";

  // Project public summary
  daf_public_summ: string; //"This will be a paragraph summarising the project. Not sure if necessary to keep";

  // HREC details
  daf_hrec_approve: string; //"1";
  daf_hrec_approve_dt: string; //"3/2/2020";
  daf_hrec_num: string; //"456789";

  // DUO mapping
  daf_type_research___case_ctrl: string; //"0";
  daf_type_research___disease: string; //"1";
  daf_type_research___hmb: string; //"0";
  daf_type_research___method_dev: string; //"0";
  daf_type_research___other: string; //"0";
  daf_type_research___poa: string; //"0";
  daf_type_research___popn_stud: string; //"1";

  // Flagship mapping
  daf_flagships___cancer: string; //"0";
  daf_flagships___genpop: string; //"0";
  daf_flagships___rare: string; //"1";
  daf_flagships_cancer___all: string; //"0";
  daf_flagships_cancer___iccon: string; //"0";
  daf_flagships_cancer___lung: string; //"0";
  daf_flagships_cancer___somatic: string; //"0";
  daf_flagships_genpop___mm: string; //"0";
  daf_flagships_rd___ac: string; //"0";
  daf_flagships_rd___bm: string; //"1";
  daf_flagships_rd___cardio: string; //"0";
  daf_flagships_rd___ee: string; //"0";
  daf_flagships_rd___gi: string; //"0";
  daf_flagships_rd___hidden: string; //"1";
  daf_flagships_rd___id: string; //"0";
  daf_flagships_rd___leuko: string; //"0";
  daf_flagships_rd___lung: string; //"1";
  daf_flagships_rd___mito: string; //"1";
  daf_flagships_rd___nmd: string; //"0";
  daf_flagships_rd___renal: string; //"0";

  daf_applicant_email: string; //"meredith@grey.com";
  daf_applicant_institution: string; // "Grey Sloan Hospital";
  daf_applicant_name: string; // "Meredith Grey";
  daf_applicant_pi_yn: string; // "0";
  daf_applicant_title: string; // "Dr";
  daf_clindata_category___1: string; // "0";
  daf_clindata_category___2: string; // "0";
  daf_clindata_category___3: string; // "0";
  daf_clindata_category___4: string; // "0";
  daf_clindata_category___5: string; // "0";
  daf_collab_num: string; // "0";
  daf_contact_email_site1: string; //"";
  daf_contact_email_site2: string; //"";
  daf_contact_email_site3: string; //"";
  daf_contact_email_site4: string; //"";
  daf_contact_email_site5: string; //"";
  daf_contact_email_site6: string; //"";
  daf_contact_email_site7: string; //"";
  daf_contact_email_site8: string; //"";
  daf_contact_email_site9: string; //"";
  daf_contact_email_site10: string; //"";
  daf_contact_email_site11: string; //"";
  daf_contact_email_site12: string; //"";
  daf_contact_email_site13: string; //"";
  daf_contact_email_site14: string; //"";
  daf_contact_email_site15: string; //"";
  daf_contact_email_site16: string; //"";
  daf_contact_email_site17: string; //"";
  daf_contact_email_site18: string; //"";
  daf_contact_email_site19: string; //"";
  daf_contact_email_site20: string; //"";
  daf_contact_site1: string; //"";
  daf_contact_site2: string; //"";
  daf_contact_site3: string; //"";
  daf_contact_site4: string; //"";
  daf_contact_site5: string; //"";
  daf_contact_site6: string; //"";
  daf_contact_site7: string; //"";
  daf_contact_site8: string; //"";
  daf_contact_site9: string; //"";
  daf_contact_site10: string; //"";
  daf_contact_site11: string; //"";
  daf_contact_site12: string; //"";
  daf_contact_site13: string; //"";
  daf_contact_site14: string; //"";
  daf_contact_site15: string; //"";
  daf_contact_site16: string; //"";
  daf_contact_site17: string; //"";
  daf_contact_site18: string; //"";
  daf_contact_site19: string; //"";
  daf_contact_site20: string; //"";
  daf_data_house_site1: string; //"";
  daf_data_house_site2: string; //"";
  daf_data_house_site3: string; //"";
  daf_data_house_site4: string; //"";
  daf_data_house_site5: string; //"";
  daf_data_house_site6: string; //"";
  daf_data_house_site7: string; //"";
  daf_data_house_site8: string; //"";
  daf_data_house_site9: string; //"";
  daf_data_house_site10: string; //"";
  daf_data_house_site11: string; //"";
  daf_data_house_site12: string; //"";
  daf_data_house_site13: string; //"";
  daf_data_house_site14: string; //"";
  daf_data_house_site15: string; //"";
  daf_data_house_site16: string; //"";
  daf_data_house_site17: string; //"";
  daf_data_house_site18: string; //"";
  daf_data_house_site19: string; //"";
  daf_data_house_site20: string; //"";
  daf_data_req: string; //"1";
  daf_data_req_subset: string; //"";
  daf_ethics_letter: string; //"ethics.pdf";
  daf_file_types___bams: string; //"1";
  daf_file_types___contact: string; //"0";
  daf_file_types___fastq: string; //"1";
  daf_file_types___phensurvey: string; //"0";
  daf_file_types___selfsurvey: string; //"0";
  daf_file_types___vcfs: string; //"1";

  daf_institution_site1: string; //"";
  daf_institution_site2: string; //"";
  daf_institution_site3: string; //"";
  daf_institution_site4: string; //"";
  daf_institution_site5: string; //"";
  daf_institution_site6: string; //"";
  daf_institution_site7: string; //"";
  daf_institution_site8: string; //"";
  daf_institution_site9: string; //"";
  daf_institution_site10: string; //"";
  daf_institution_site11: string; //"";
  daf_institution_site12: string; //"";
  daf_institution_site13: string; //"";
  daf_institution_site14: string; //"";
  daf_institution_site15: string; //"";
  daf_institution_site16: string; //"";
  daf_institution_site17: string; //"";
  daf_institution_site18: string; //"";
  daf_institution_site19: string; //"";
  daf_institution_site20: string; //"";
  daf_pi_email: string; //"christina@yang.com";
  daf_pi_institution: string; //"";
  daf_pi_institution_same: string; //"Yes";
  daf_pi_name: string; //"Christina Yang";
}
