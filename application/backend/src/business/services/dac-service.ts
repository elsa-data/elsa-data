import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { AuthenticatedUser } from "../authenticated-user";
import { ElsaSettings } from "../../config/elsa-settings";
import { ReleaseService } from "./release-service";
import { Dac } from "../../config/config-schema-dac";

/**
 * A service wrapping all our upstream Data Access Committee
 * functionality. DACs are the process by which new releases are created.
 */
@injectable()
export class DacService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(UserService) private readonly userService: UserService,
    @inject(ReleaseService) private readonly releaseService: ReleaseService
  ) {}

  /**
   * Return all the upstream instances of DACs that need to be displayed in the UI
   * for users who can make new releases.
   *
   * @param user
   */
  public async getInstances(user: AuthenticatedUser): Promise<Dac[]> {
    // TODO rather than use permission from cookie - make a db check here
    if (!user.isAllowedCreateRelease)
      throw new Error(
        "Only users who can create new releases can access information about the upstream DACs"
      );

    return this.settings.dacs;
  }
}
