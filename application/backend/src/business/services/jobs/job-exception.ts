import { Base7807Error } from "@umccr/elsa-types";

export class ReleaseNeedsActivationToStartJob extends Base7807Error {
  constructor(jobType: string, releaseKey: string) {
    super(
      "The release must be activated before attempting to start this job",
      400,
      `Release ${releaseKey} is not activated and so a job of type ${jobType} cannot be started`,
    );
  }
}

export class CopyOutServiceNotInstalled extends Base7807Error {
  constructor() {
    super(
      "The copy out infrastructure/service must be installed and locatable to initiate copy out jobs",
      500,
      "The discovery service was asked for the location of the 'copy out' " +
        "service and it returned an empty result. This is likely to be " +
        "a fundamental configuration error in the underlying environment",
    );
  }
}
