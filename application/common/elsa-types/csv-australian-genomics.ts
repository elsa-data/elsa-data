// these are the raw CSV fields out of the AG redcap
// NOTE: we are not doing type/schema checking against this - this is the
// theoretical output - but be very careful about using values without checking validity
export interface AustraliaGenomicsDacRedcap {
  // Application number
  daf_num: string; //"2";

  // Application date
  application_date_hid: string; // "23/4/2021";

  // Project Title
  daf_project_title: string; //"Test project 2";

  // Project public summary
  daf_public_summ: string; //"This will be a paragraph summarising the project. Not sure if necessary to keep";

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
  daf_contact_email_site1: "";
  daf_contact_email_site2: "";
  daf_contact_email_site3: "";
  daf_contact_email_site4: "";
  daf_contact_email_site5: "";
  daf_contact_email_site6: "";
  daf_contact_email_site7: "";
  daf_contact_email_site8: "";
  daf_contact_email_site9: "";
  daf_contact_email_site10: "";
  daf_contact_email_site11: "";
  daf_contact_email_site12: "";
  daf_contact_email_site13: "";
  daf_contact_email_site14: "";
  daf_contact_email_site15: "";
  daf_contact_email_site16: "";
  daf_contact_email_site17: "";
  daf_contact_email_site18: "";
  daf_contact_email_site19: "";
  daf_contact_email_site20: "";
  daf_contact_site1: "";
  daf_contact_site2: "";
  daf_contact_site3: "";
  daf_contact_site4: "";
  daf_contact_site5: "";
  daf_contact_site6: "";
  daf_contact_site7: "";
  daf_contact_site8: "";
  daf_contact_site9: "";
  daf_contact_site10: "";
  daf_contact_site11: "";
  daf_contact_site12: "";
  daf_contact_site13: "";
  daf_contact_site14: "";
  daf_contact_site15: "";
  daf_contact_site16: "";
  daf_contact_site17: "";
  daf_contact_site18: "";
  daf_contact_site19: "";
  daf_contact_site20: "";
  daf_data_house_site1: "";
  daf_data_house_site2: "";
  daf_data_house_site3: "";
  daf_data_house_site4: "";
  daf_data_house_site5: "";
  daf_data_house_site6: "";
  daf_data_house_site7: "";
  daf_data_house_site8: "";
  daf_data_house_site9: "";
  daf_data_house_site10: "";
  daf_data_house_site11: "";
  daf_data_house_site12: "";
  daf_data_house_site13: "";
  daf_data_house_site14: "";
  daf_data_house_site15: "";
  daf_data_house_site16: "";
  daf_data_house_site17: "";
  daf_data_house_site18: "";
  daf_data_house_site19: "";
  daf_data_house_site20: "";
  daf_data_req: string; //"1";
  daf_data_req_subset: string; //"";
  daf_ethics_letter: string; //"ethics.pdf";
  daf_file_types___bams: string; //"1";
  daf_file_types___contact: string; //"0";
  daf_file_types___fastq: string; //"1";
  daf_file_types___phensurvey: string; //"0";
  daf_file_types___selfsurvey: string; //"0";
  daf_file_types___vcfs: string; //"1";

  daf_hrec_approve: string; //"1";
  daf_hrec_approve_dt: string; //"3/2/2020";
  daf_hrec_num: string; //"456789";
  daf_institution_site1: "";
  daf_institution_site2: "";
  daf_institution_site3: "";
  daf_institution_site4: "";
  daf_institution_site5: "";
  daf_institution_site6: "";
  daf_institution_site7: "";
  daf_institution_site8: "";
  daf_institution_site9: "";
  daf_institution_site10: "";
  daf_institution_site11: "";
  daf_institution_site12: "";
  daf_institution_site13: "";
  daf_institution_site14: "";
  daf_institution_site15: "";
  daf_institution_site16: "";
  daf_institution_site17: "";
  daf_institution_site18: "";
  daf_institution_site19: "";
  daf_institution_site20: "";
  daf_pi_email: string; //"christina@yang.com";
  daf_pi_institution: string; //"";
  daf_pi_institution_same: string; //"Yes";
  daf_pi_name: string; //"Christina Yang";
}
