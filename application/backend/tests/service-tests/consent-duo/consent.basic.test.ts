import { ConsentDuoService } from "../../../src/business/services/consent/duo/consent-duo-service";
import {
  DUO_DS,
  DUO_GRU,
  DUO_NRES,
  DUO_POA,
} from "../../../src/business/services/consent/duo/duo-schemas";
import { registerTypes } from "../../test-dependency-injection.common";

let consentDuoService: ConsentDuoService;

const testContainer = registerTypes();

beforeEach(async () => {
  consentDuoService = testContainer.resolve(ConsentDuoService);
});

it("test for an application of general research usage where patient has only disease specific", async () => {
  const consented = await consentDuoService.applyConsent(
    {},
    {
      researchType: DUO_GRU,
    },
    [],
    [],
    [
      {
        code: DUO_DS,
        diseaseSystem: "SNOMED",
        diseaseCode: "code-for-diabetes",
      },
    ],
    [],
  );

  expect(consented).toBe(false);
});

it("test for an application of general research usage where patient has general research usage", async () => {
  const consented = await consentDuoService.applyConsent(
    {},
    {
      researchType: DUO_GRU,
    },
    [],
    [],
    [
      {
        code: DUO_GRU,
      },
    ],
    [],
  );

  expect(consented).toBe(true);
});

it("test for a variety of research types where the consent is no restrictions", async () => {
  // GRU should succeed
  {
    const consented = await consentDuoService.applyConsent(
      {},
      {
        researchType: DUO_GRU,
      },
      [],
      [],
      [
        {
          code: DUO_NRES,
        },
      ],
      [],
    );

    expect(consented).toBe(true);
  }
  // POA should succeed
  {
    const consented = await consentDuoService.applyConsent(
      {},
      {
        researchType: DUO_POA,
      },
      [],
      [],
      [
        {
          code: DUO_NRES,
        },
      ],
      [],
    );

    expect(consented).toBe(true);
  }
  // no research type should succeed
  {
    const consented = await consentDuoService.applyConsent(
      {},
      {
        researchType: undefined,
      },
      [],
      [],
      [
        {
          code: DUO_NRES,
        },
      ],
      [],
    );

    expect(consented).toBe(true);
  }
});
