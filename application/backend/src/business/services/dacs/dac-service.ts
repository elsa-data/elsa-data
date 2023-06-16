import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { AuthenticatedUser } from "../../authenticated-user";
import { ElsaSettings } from "../../../config/elsa-settings";
import { ReleaseService } from "../release-service";
import { DacType } from "../../../config/config-schema-dac";
import _ from "lodash";
import { RemsService } from "./rems-service";
import { RedcapImportApplicationService } from "../australian-genomics/redcap-import-application-service";

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
    @inject(ReleaseService) private readonly releaseService: ReleaseService,
    @inject(RemsService) private readonly remsService: RemsService,
    @inject(RedcapImportApplicationService)
    private redcapImportApplicationService: RedcapImportApplicationService
  ) {}

  /**
   * Return all the upstream instances of DACs that need to be displayed in the UI
   * for users who can make new releases.
   *
   * @param user
   */
  public async getConfigured(user: AuthenticatedUser): Promise<DacType[]> {
    // TODO rather than use permission from cookie - make a db check here
    if (!user.isAllowedCreateRelease)
      // NOTE we make the decision that anyone can call this API without error - but that
      // the lack of permissions just means they get no information back
      // the reason is that this method is called on startup by all users even if the
      // data is not needed because they don't have permissions
      return [];

    return _.cloneDeep(this.settings.dacs);
  }

  /**
   * Handles the clever dispatching of DAC operations to the correct DAC services. In
   * this case we dispatch the "detectNew" to the right DAC service (but not for "manual"
   * as that doesn't need a detectNew operation).
   *
   * @param user
   * @param id
   * @param body
   */
  public async detectNew(user: AuthenticatedUser, id: string, body: any) {
    for (const d of this.settings.dacs) {
      if (d.id === id) {
        switch (d.type) {
          case "redcap-australian-genomics-csv":
            return await this.redcapImportApplicationService.detectNewReleases(
              user,
              d,
              body
            );
          case "rems":
            // WIP need to pass in data and fix rems service
            return await this.remsService.detectNewReleases(user);
          case "manual":
            throw new Error(
              "detectNew should never be called on a 'manual' DAC"
            );
          default:
            throw new Error(`Unknown DAC type ${(d as any).type}`);
        }
      }
    }
  }

  public async createNew(user: AuthenticatedUser, id: string, body: any) {
    for (const d of this.settings.dacs) {
      if (d.id === id) {
        switch (d.type) {
          case "redcap-australian-genomics-csv":
            return await this.redcapImportApplicationService.startNewRelease(
              user,
              d,
              body
            );
          case "rems":
            // WIP need to pass in data and fix rems service
            return await this.remsService.startNewRelease(user, body);
          case "manual":
            return await this.releaseService.new(user, body);
          default:
            throw new Error(`Unknown DAC type ${(d as any).type}`);
        }
      }
    }
  }
}
