import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { RedcapImportApplicationService } from "../../src/business/services/dacs/redcap-import-application-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { AustraliaGenomicsDacRedcap } from "@umccr/elsa-types";
import { UserService } from "../../src/business/services/user-service";
import { DacRedcapAustralianGenomicsCsvType } from "../../src/config/config-schema-dac";
import { TENG_URI } from "../../src/test-data/dataset/insert-test-data-10g";
import { SMARTIE_URI } from "../../src/test-data/dataset/insert-test-data-smartie";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";

const testContainer = registerTypes();

const edgedbClient = edgedb.createClient();

const configDac: DacRedcapAustralianGenomicsCsvType = {
  id: "aaa",
  type: "redcap-australian-genomics-csv",
  description: "A description",
  identifierSystem: "https://redcap-server.com",
  csvFlagshipDatasets: {
    daf_type_research___hmb: TENF_URI,
    daf_flagships_rd___nmd: TENG_URI,
  },
};
describe("Redcap Import for AG", () => {
  let allowedAdministratorUser: AuthenticatedUser;

  beforeAll(async () => {});

  beforeEach(async () => {
    ({ allowedAdministratorUser } = await beforeEachCommon(testContainer));
  });

  it("Base case with two new users", async () => {
    const redcapImportService = testContainer.resolve(
      RedcapImportApplicationService
    );
    const userService = testContainer.resolve(UserService);

    const app = {
      ...sampleApplication1,
      daf_type_research___hmb: "1",
      // this maps to our 10g dataset
      daf_flagships_rd___nmd: "1",
      // an application from entirely unknown users - Albus as applicant/Manager
      daf_applicant_name: "Albus Dumbledore",
      daf_applicant_email: "albus@example.com",
      daf_applicant_institution: "Hogwarts",
      daf_applicant_pi_yn: "1",
      // one other collaborator
      daf_collab_num: "1",
      daf_institution_site1: "Durmstrang",
      daf_contact_site1: "Igor Karkaroff",
      daf_contact_email_site1: "igor@durmstrang.org",
      daf_data_house_site1: "1",
    };

    await redcapImportService.startNewRelease(
      allowedAdministratorUser,
      configDac,
      app
    );

    const potentialCount = await e
      .count(e.permission.PotentialUser)
      .run(edgedbClient);
    expect(potentialCount).toBe(2);
  });

  it("Base case with existing user mention", async () => {
    // our base scenario makes 5 users but lets confirm that
    const existingUserCount = await e
      .count(e.permission.User)
      .run(edgedbClient);
    expect(existingUserCount).toBe(5);

    const redcapImportService = testContainer.resolve(
      RedcapImportApplicationService
    );

    const app = {
      ...sampleApplication1,
      daf_type_research___hmb: "1",
      // this maps to our 10g dataset
      daf_flagships_rd___nmd: "1",
      // the application is from Albus
      daf_applicant_name: "Albus Dumbledore",
      daf_applicant_email: "albus@example.com",
      daf_applicant_institution: "Hogwarts",
      daf_applicant_pi_yn: "0",
      // but we have an explicit Manager - that we know!
      daf_pi_name: "Test User Who Isn't Allowed Any Access",
      daf_pi_email: "subject1@elsa.net", // refer to release.common.ts file
      daf_pi_institution: "Made Up",
      daf_pi_institution_same: "0",
      // one other collaborator (who is unknown)
      daf_collab_num: "1",
      daf_institution_site1: "Durmstrang",
      daf_contact_site1: "Igor Karkaroff",
      daf_contact_email_site1: "igor@durmstrang.org",
      daf_data_house_site1: "1",
    };

    await redcapImportService.startNewRelease(
      allowedAdministratorUser,
      configDac,
      app
    );

    const potentialCount = await e
      .count(e.permission.PotentialUser)
      .run(edgedbClient);
    expect(potentialCount).toBe(1);

    const userCount = await e.count(e.permission.User).run(edgedbClient);
    expect(userCount).toBe(5);
  });
});

const sampleApplication1 = {
  daf_num: "SAMPLE1",
  application_date_hid: "1/1/2022",
  daf_hrec_approve: "1",
  daf_ethics_letter: "file.pdf",
  daf_hrec_num: "123456",
  daf_hrec_approve_dt: "1/1/2022",
  daf_project_title: "Test Project 1",
  daf_public_summ: "Project summarising",
  daf_type_research___method_dev: "0",
  daf_type_research___case_ctrl: "0",
  daf_type_research___popn_stud: "0",
  daf_type_research___hmb: "0",
  daf_type_research___poa: "0",
  daf_type_research___disease: "0",
  daf_type_research___other: "0",
  daf_applicant_title: "",
  daf_applicant_name: "",
  daf_applicant_institution: "",
  daf_applicant_email: "",
  daf_applicant_pi_yn: "0",
  daf_pi_name: "",
  daf_pi_institution_same: "",
  daf_pi_institution: "",
  daf_pi_email: "",
  daf_collab_num: "",
  daf_institution_site1: "",
  daf_contact_site1: "",
  daf_contact_email_site1: "",
  daf_data_house_site1: "",
  daf_institution_site2: "",
  daf_contact_site2: "",
  daf_contact_email_site2: "",
  daf_data_house_site2: "",
  daf_institution_site3: "",
  daf_contact_site3: "",
  daf_contact_email_site3: "",
  daf_data_house_site3: "",
  daf_institution_site4: "",
  daf_contact_site4: "",
  daf_contact_email_site4: "",
  daf_data_house_site4: "",
  daf_institution_site5: "",
  daf_contact_site5: "",
  daf_contact_email_site5: "",
  daf_data_house_site5: "",
  // ... all the way to 15 - but not necessary for our tests
} as AustraliaGenomicsDacRedcap;
