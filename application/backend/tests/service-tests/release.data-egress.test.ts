import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { AuditLogService } from "../../src/business/services/audit-log-service";
import { addSeconds } from "date-fns";
import { ReleaseDataEgressService } from "../../src/business/services/release-data-egress-service";

let testReleaseKey: string;

let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditLogService: AuditLogService;
let releaseDataEgressService: ReleaseDataEgressService;
let edgeDbClient: edgedb.Client;

const testContainer = registerTypes();

beforeEach(async () => {
  ({
    testReleaseKey,
    allowedAdministratorUser,
    allowedManagerUser,
    notAllowedUser,
    edgeDbClient,
  } = await beforeEachCommon(testContainer));

  releaseDataEgressService = testContainer.resolve(ReleaseDataEgressService);
});

it("audit data access log", async () => {
  const start = new Date();

  // Pre-insert file storage
  const fileUrl = "s3://elsa-bucket/PRM001.fastq.gz";
  await e
    .insert(e.storage.File, {
      url: fileUrl,
      size: 123,
      checksums: [{ type: "MD5", value: "abcde123" }],
    })
    .run(edgeDbClient);

  await e
    .update(e.release.Release, (r) => ({
      filter: e.op(testReleaseKey, "=", r.releaseKey),
      set: {
        dataEgressRecord: {
          "+=": e.insert(e.release.DataEgressRecord, {
            auditId: "abcd-defg-hijk-lmno",
            occurredDateTime: e.datetime(new Date()),
            description: "Accessed via pre-signed URL",
            sourceIpAddress: "123.123.123.123",
            sourceLocation: "Melbourne, Australia",
            egressBytes: 10188721080,
            fileUrl: fileUrl,
            fileSize: 30,
          }),
        },
      },
    }))
    .run(edgeDbClient);

  const res = await releaseDataEgressService.getDataEgressRecordsByReleaseKey(
    allowedAdministratorUser,
    testReleaseKey,
    10,
    0
  );
  const firstData = res.data?.length ? res.data[0] : null;

  expect(res.total).toBe(1);
  expect(firstData?.fileUrl).toBe(fileUrl);
});
