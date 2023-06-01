import { registerTypes } from "../test-dependency-injection.common";
import { AuditEventTimedService } from "../../src/business/services/audit-event-timed-service";
import fn = jest.fn;

let auditEventTimedService: AuditEventTimedService;

const testContainer = registerTypes();

beforeEach(async () => {
  auditEventTimedService = testContainer.resolve(AuditEventTimedService);
});

it("create timed audit event", async () => {
  const startFn = fn(async (_: Date) => {
    return "id";
  });
  const endFn = fn(async (id: string, _: Date) => {
    expect(id).toEqual("id");
  });

  const id = await auditEventTimedService.createTimedAuditEvent(
    "key",
    { seconds: 1 },
    startFn,
    endFn
  );
  expect(startFn).toBeCalledTimes(1);
  expect(endFn).not.toBeCalled();

  const id_null = await auditEventTimedService.createTimedAuditEvent(
    "key",
    { seconds: 1 },
    startFn,
    endFn
  );
  expect(startFn).toBeCalledTimes(1);
  expect(endFn).not.toBeCalled();

  await new Promise((resolve) => setTimeout(resolve, 1100));

  expect(id).toEqual("id");
  expect(id_null).toEqual(null);

  expect(startFn).toBeCalledTimes(1);
  expect(endFn).toBeCalledTimes(1);
});
