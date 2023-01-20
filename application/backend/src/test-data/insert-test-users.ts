import * as edgedb from "edgedb";
const edgeDbClient = edgedb.createClient();

// these are 3 constants for users that are created *only* in development/test mode
// NOTE: when enabled - these subjects go beyond having some test data in the db - these
// users are enabled in the APIs to do a variety of things
// DON'T LEAVE ON TEST MODE IN AN INSTANCE NOT MEANT FOR TESTING!
export const TEST_SUBJECT_1 = "http://subject1.com";
export const TEST_SUBJECT_1_EMAIL = "subject1@elsa.net";
export const TEST_SUBJECT_1_DISPLAY = "Test User 1";
export const TEST_SUBJECT_2 = "http://subject2.com";
export const TEST_SUBJECT_2_EMAIL = "subject2@elsa.net";
export const TEST_SUBJECT_2_DISPLAY = "Test User 2";
export const TEST_SUBJECT_3 = "http://subject3.com";
export const TEST_SUBJECT_3_EMAIL = "subject3@elsa.net";
export const TEST_SUBJECT_3_DISPLAY = "Test User 3";
