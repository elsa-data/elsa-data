import { ConsentDuoService } from "../../../src/business/services/consent/duo/consent-duo-service";
import {
  DUO_DS,
  DUO_GRU,
  DUO_GS,
  DUO_NRES,
  DUO_POA,
} from "../../../src/business/services/consent/duo/duo-schemas";
import { registerTypes } from "../../test-dependency-injection.common";

let consentDuoService: ConsentDuoService;

const testContainer = registerTypes();

beforeEach(async () => {
  consentDuoService = testContainer.resolve(ConsentDuoService);
});

const SNOMED_SYSTEM = "SNOMED";
const USHERS_CODE = "USHERS";
const NEURO_CODE = "NEURO";
const EYE_CODE = "EYE";
const SEXUAL_CODE = "SEXUAL";
const BUNIONS_CODE = "BUNIONS";

// to be used when we get actual term support
const SNOMED_HEREDITARY_DISORDER_AUDITORY = "362991006";
const SNOMED_HEREDITARY_DISORDER_CARDIOVASCULAR = "363005004";
const SNOMED_HEREDITARY_DISORDER_ENDOCRINE = "363104002";
const SNOMED_HEREDITARY_DISORDER_IMMUNE = "363138005";
const SNOMED_HEREDITARY_DISORDER_LYMPHATIC = "363190001";
const SNOMED_HEREDITARY_DISORDER_MUSCULOSKELETAL = "363212003";
const SNOMED_HEREDITARY_DISORDER_NERVOUS = "363235000";
const SNOMED_HEREDITARY_DISORDER_INTEGUMENT = "363185004";
const SNOMED_HEREDITARY_DISORDER_URINARY = "363338001";
const SNOMED_HEREDITARY_DISORDER_VISUAL = "363343008";

const SNOMED_USHERS = "57838006";

const lookup = async (system: string, code1: string, code2: string) => {
  if (system == SNOMED_SYSTEM) {
    // in SNOMED we can say that identical codes are always IsA
    if (code1 == code2) return true;

    if (code1 == USHERS_CODE && code2 == NEURO_CODE) return true;
    if (code1 == USHERS_CODE && code2 == EYE_CODE) return true;
    if (code1 == USHERS_CODE && code2 == SEXUAL_CODE) return false;

    // bunions falls under none of the hierarches we want to test with
    if (code1 == BUNIONS_CODE) return false;

    throw new Error(
      `Used code1 = ${code1} and code2 = ${code2} in way that is not set up for testing`,
    );
  }

  // open question - if the system is unknown but the codes are identical - can we return true
  return false;
};

it("test for an application of general research usage where patient has more specific consent though", async () => {
  const consented = await consentDuoService.applyConsent(
    {
      diseaseIsA: lookup,
    },
    {
      researchType: DUO_GRU,
    },
    [],
    [],
    [
      {
        code: DUO_DS,
        diseaseSystem: SNOMED_SYSTEM,
        diseaseCode: NEURO_CODE,
      },
    ],
    [],
  );

  expect(consented).toBe(false);
});

it("test for an application of general research usage where patient has disease only consent but the specimen is broadly consented", async () => {
  // as the most specific statement - the NRES sharing of the specimen will take
  // precedence over the DS sharing at the patient level
  const consented = await consentDuoService.applyConsent(
    {
      diseaseIsA: lookup,
    },
    {
      researchType: DUO_GRU,
    },
    [],
    [],
    [
      {
        code: DUO_DS,
        diseaseSystem: SNOMED_SYSTEM,
        diseaseCode: NEURO_CODE,
      },
    ],
    [
      {
        code: DUO_NRES,
      },
    ],
  );

  expect(consented).toBe(true);
});

it("test for disease specifics with lookups", async () => {
  // ushers is a neuro disease so should match
  {
    const consented = await consentDuoService.applyConsent(
      {
        diseaseIsA: lookup,
      },
      {
        researchType: DUO_DS,
        disease: USHERS_CODE,
      },
      [],
      [],
      [
        {
          code: DUO_DS,
          diseaseSystem: SNOMED_SYSTEM,
          diseaseCode: NEURO_CODE,
        },
      ],
      [],
    );

    expect(consented).toBe(true);
  }
  // ushers is ushers
  {
    const consented = await consentDuoService.applyConsent(
      {
        diseaseIsA: lookup,
      },
      {
        researchType: DUO_DS,
        disease: USHERS_CODE,
      },
      [],
      [],
      [
        {
          code: DUO_DS,
          diseaseSystem: SNOMED_SYSTEM,
          diseaseCode: USHERS_CODE,
        },
      ],
      [],
    );

    expect(consented).toBe(true);
  }
  // bunions is not a neuro disease so should not match
  {
    const consented = await consentDuoService.applyConsent(
      {
        diseaseIsA: lookup,
      },
      {
        researchType: DUO_DS,
        disease: BUNIONS_CODE,
      },
      [],
      [],
      [
        {
          code: DUO_DS,
          diseaseSystem: SNOMED_SYSTEM,
          diseaseCode: NEURO_CODE,
        },
      ],
      [],
    );

    expect(consented).toBe(false);
  }
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
  // no restrictions will succeed even if no research type given
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

// disabled due to the Typebox Compile/Check not working correctly
it("test JSON validation of limitations", async () => {
  await expect(
    consentDuoService.applyConsent(
      {},
      {
        researchType: DUO_GRU,
      },
      [],
      [],
      [
        // add some invalid data types and cause it to schema fail
        {
          code: DUO_DS,
          diseaseSystem: 5,
        } as any,
      ],
      [],
    ),
  ).rejects.toThrow("not meet our DUO limitation schema");

  await expect(
    consentDuoService.applyConsent(
      {},
      {
        researchType: DUO_GRU,
      },
      [],
      [],
      [
        // missing data
        {
          code: DUO_DS,
        } as any,
      ],
      [],
    ),
  ).rejects.toThrow("not meet our DUO limitation schema");

  // modifiers invalid
  const x: any = {
    code: DUO_GRU,
    modifiers: [
      {
        code: DUO_GS,
        // mispelt modifier
        places: ["AUSTRALIA"],
      },
    ],
  };

  await expect(
    consentDuoService.applyConsent(
      {},
      { researchType: DUO_GRU },
      [],
      [],
      [x],
      [],
    ),
  ).rejects.toThrow("not meet our DUO limitation schema");
});
