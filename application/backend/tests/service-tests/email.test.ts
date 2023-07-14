import { Client } from "edgedb";
import { registerTypes } from "../test-dependency-injection.common";
import { EmailService } from "../../src/business/services/email-service";
import { mockClient } from "aws-sdk-client-mock";
import { SendRawEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { AwsEnabledServiceMock } from "./client-mocks";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { createTestElsaSettings } from "../test-elsa-settings.common";

let edgeDbClient: Client;
let emailService: EmailService;

let awsEnabledServiceMock: AwsEnabledServiceMock;

const sesClientMock = mockClient(SESClient);

const testContainer = registerTypes();

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  emailService = testContainer.resolve(EmailService);
  awsEnabledServiceMock = testContainer.resolve(AwsEnabledServiceMock);
});

beforeEach(async () => {
  sesClientMock.reset();
  awsEnabledServiceMock.reset();

  await emailService.setup();
});

it("send email", async () => {
  sesClientMock.on(SendRawEmailCommand).resolves({
    MessageId: "MessageId",
  });

  const info = await emailService.sendEmailTemplate(
    "release/release-activated",
    "test@example.com",
    {
      releaseKey: "R001",
      name: "name",
      fromName: "Elsa Data",
    }
  );

  expect(info).toHaveProperty("envelope");
  expect(info).toHaveProperty("messageId");
  expect(info).toHaveProperty("originalMessage");

  expect(info.messageId).toContain("MessageId");
  expect(info.envelope.from).toBe("no-reply@example.com");
  expect(info.envelope.to).toContain("test@example.com");

  expect(info.originalMessage.html).toContain("name");
});

it("send email override locals", async () => {
  const testContainerOverrideLocals = testContainer.createChildContainer();
  testContainerOverrideLocals.register<ElsaSettings>("Settings", {
    useFactory: () => {
      let settings = createTestElsaSettings();

      if (settings.emailer !== undefined) {
        settings.emailer.templateDictionary = {
          // Expect to be able to replace known locals
          name: "Test Name",
          // Unknown locals should be ignored.
          unknownKey: "Unknown Value",
        };
      }

      return settings;
    },
  });
  testContainerOverrideLocals.registerSingleton(EmailService);

  const emailServiceOverrideLocals =
    testContainerOverrideLocals.resolve(EmailService);
  await emailServiceOverrideLocals.setup();

  sesClientMock.on(SendRawEmailCommand).resolves({
    MessageId: "MessageId",
  });

  const info = await emailServiceOverrideLocals.sendEmailTemplate(
    "release/release-activated",
    "test@example.com",
    {
      releaseKey: "R001",
      name: "name",
      fromName: "Elsa Data",
    }
  );

  expect(info).toHaveProperty("envelope");
  expect(info).toHaveProperty("messageId");
  expect(info).toHaveProperty("originalMessage");

  expect(info.messageId).toContain("MessageId");
  expect(info.envelope.from).toBe("no-reply@example.com");
  expect(info.envelope.to).toContain("test@example.com");

  expect(info.originalMessage.html).toContain("Test Name");
});
