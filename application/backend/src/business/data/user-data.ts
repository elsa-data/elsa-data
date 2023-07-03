import { inject } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { UserGetBySubjectIdReturns } from "../../../dbschema/queries";

export type SingleUserBySubjectIdType = UserGetBySubjectIdReturns;

export class UserData {
  constructor(@inject("Settings") private readonly settings: ElsaSettings) {}
}
