import { Compile } from "typebox/compile";
import { DUO_GRU, DUO_POA, DuoLimitationSchema } from "./duo-schemas.ts";
import type {
  DuoGeneralResearchUseType,
  DuoPopulationAncestryResearchOnlyType,
  KnownLimitationCode,
  KnownModifierCode,
} from "./duo-types.ts";

const _populationExample: DuoPopulationAncestryResearchOnlyType = {
  code: DUO_POA,
  modifiers: [],
};

const _generalExample: DuoGeneralResearchUseType = {
  code: DUO_GRU,
  modifiers: [
    {
      code: "DUO:0000045",
    },
  ],
};

const C = Compile(DuoLimitationSchema);

C.Check({
  code: "DUO:0000011",
  modifiers: [],
});

const _modifierString: KnownModifierCode = "DUO:0000028";
const _limitationString: KnownLimitationCode = "DUO:0000011";
