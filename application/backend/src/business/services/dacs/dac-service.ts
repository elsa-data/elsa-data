import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { AuthenticatedUser } from "../../authenticated-user";
import { ElsaSettings } from "../../../config/elsa-settings";
import { ReleaseService } from "../releases/release-service";
import { DacType } from "../../../config/config-schema-dac";
import _ from "lodash";
import { RemsService } from "./rems-service";
import { RedcapImportApplicationService } from "./redcap-import-application-service";
import { UserData } from "../../data/user-data";

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
    private redcapImportApplicationService: RedcapImportApplicationService,
    @inject(UserData) private readonly userData: UserData
  ) {}

  /**
   * Return all the upstream instances of DACs that need to be displayed in the UI
   * for users who can make new releases.
   *
   * @param user
   */
  public async getConfigured(user: AuthenticatedUser): Promise<DacType[]> {
    // get the most up-to-date version of this user as we need to check their up-to-date perms
    const u = await this.userData.getDbUser(this.edgeDbClient, user);

    if (!u.isAllowedCreateRelease)
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
   * @param id the DAC id
   * @param body arbitrary data dependent on DAC type
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
            // for detection for REMS there is no data to pass in... the service itself
            // reaches out and makes the detect call
            return await this.remsService.detectNewReleases(user, d);
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

  /**
   * Handles the clever dispatching to the correct DAC service the call to actually
   * make a new release.
   *
   * @param user
   * @param id the DAC id
   * @param body arbitrary data dependent on DAC type
   */
  public async createNew(user: AuthenticatedUser, id: string, body: any) {
    for (const d of this.settings.dacs) {
      if (d.id === id) {
        switch (d.type) {
          case "redcap-australian-genomics-csv":
            // a redcap create takes in the body which is the single row of
            // CSV data from redcap as a single JSON object
            return await this.redcapImportApplicationService.startNewRelease(
              user,
              d,
              body
            );
          case "rems":
            // creating a new REMS takes an application number
            // we parse here before passing it into the service
            return await this.remsService.startNewRelease(
              user,
              d,
              parseInt(body)
            );
          case "manual":
            return await this.releaseService.new(user, body);
          default:
            throw new Error(`Unknown DAC type ${(d as any).type}`);
        }
      }
    }
  }
}
