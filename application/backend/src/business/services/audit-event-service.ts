import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { UsersService } from "./users-service";

@injectable()
export class AuditEventService {
  constructor(
    @inject("Settings") private settings: ElsaSettings,
    private _usersService: UsersService
  ) {}
}
