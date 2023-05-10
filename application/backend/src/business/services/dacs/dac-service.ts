import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { AuthenticatedUser } from "../authenticated-user";
import { ElsaSettings } from "../../config/elsa-settings";
import { ReleaseService } from "./release-service";
import { Dac } from "../../config/config-schema-dac";
import _ from "lodash";

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
  public async getConfigured(user: AuthenticatedUser): Promise<Dac[]> {
    // TODO rather than use permission from cookie - make a db check here
    if (!user.isAllowedCreateRelease)
      // NOTE we make the decision that anyone can call this API without error - but that
      // the lack of permissions just means they get no information back
      // the reason is that this method is called on startup by all users even if the
      // data is not needed because they don't have permissions
      return [];

    return _.cloneDeep(this.settings.dacs);
  }
}
