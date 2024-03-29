import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import { UserRoleInRelease } from "./releases/release-base-service";

/**
 * A service that holds common definitions of permission business
 * logic - in conjunction with any settings/configuration.
 *
 * This should be used wherever the business logic is not already embedded
 * into the EdgeQl queries.
 *
 * NOTE: these methods should be as purely as possible *just* the
 * permission logic. Other logic such as ("is this release activated") should
 * still be performed in the relevant service.
 */
@injectable()
export class PermissionService {
  constructor(@inject("Settings") private readonly settings: ElsaSettings) {}

  /**
   * Returns true if the given user/role is allowed to download TSV
   * manifests for data of a release.

   * @returns
   */
  public canAccessData(userRole: UserRoleInRelease): boolean {
    // by default only 'Manager' and 'Member' can access data,
    // but we allow a config setting that extends this to admins too
    // (there is no mechanism for "AdminView" people to obtain data)
    return (
      userRole === "Manager" ||
      userRole === "Member" ||
      (!!this.settings.permission?.releaseAdministratorsCanAlsoAccessData &&
        userRole === "Administrator")
    );
  }

  public canViewReleaseSelection(userRole: UserRoleInRelease): boolean {
    return userRole === "Administrator" || userRole === "AdminView";
  }

  public canEditReleaseSelection(userRole: UserRoleInRelease): boolean {
    return userRole === "Administrator";
  }

  public canEditReleaseApplicationCoding(userRole: UserRoleInRelease): boolean {
    return userRole === "Administrator";
  }
}
