import type { Executor } from "gel";
import { injectable } from "tsyringe";
import {
  releaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointGet,
  type ReleaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointGetReturns,
  releaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointReset,
  releaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointSet,
} from "../../../dbschema/queries";

/**
 * The ReleaseDataSharingConfigurationData is a class wrapping database interactions for release data sharing.
 *
 * It must only be used by other Services, and only where the operations/params
 * are known to be valid/allowed. That is, these methods would never
 * be called with unchecked data from the internet (unless the method
 * explicitly says that it can handle it).
 */
@injectable()
export class ReleaseDataSharingConfigurationData {
  constructor() {}

  /**
   * Get the htsget VPC lattice data sharing configuration for a given release.
   *
   * @param executor
   * @param releaseKey
   */
  public async getHtsgetAwsVpcLatticeAccessPoint(
    executor: Executor,
    releaseKey: string,
  ): Promise<ReleaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointGetReturns> {
    return await releaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointGet(
      executor,
      {
        releaseKey: releaseKey,
      },
    );
  }

  /**
   * Sets the htsget VPC lattice data sharing configuration for a given release.
   *
   * @param executor
   * @param releaseKey
   * @param destinationName
   * @param vpcId
   * @param accountId
   * @param htsgetResponse
   *
   */
  public async setHtsgetAwsVpcLatticeAccessPoint(
    executor: Executor,
    releaseKey: string,
    destinationName: string,
    vpcId: string,
    accountId: string,
    htsgetResponse: any,
  ): Promise<void> {
    await releaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointSet(
      executor,
      {
        releaseKey: releaseKey,
        destinationName: destinationName,
        vpcId: vpcId,
        accountId: accountId,
        response: htsgetResponse,
      },
    );
  }

  /**
   * Reset the htsget VPC lattice data sharing configuration for a given release.
   *
   * @param executor
   * @param releaseKey
   */
  public async resetHtsgetAwsVpcLatticeAccessPoint(
    executor: Executor,
    releaseKey: string,
  ): Promise<void> {
    await releaseDataSharingConfigurationHtsgetAwsVpcLatticeAccessPointReset(
      executor,
      {
        releaseKey: releaseKey,
      },
    );
  }
}
