/**
 * Assuming the value passed in is a Job as selected from EdgeDb - this
 * return a string that we use to identify the job type (basically the
 * name of the type in EdgeDb). Because the shape of the job from EdgeDb
 * can vary we have typed the param as 'any' - it will throw an error
 * if the input turns out not to be of the right format.
 *
 * @param j
 */
export function jobAsType(j: any): string {
  // we need to return the job type so the job system can know which 'work' to do
  // edgedb has this info in the job object
  const typeName = j?.__type__?.name;

  if (typeName && typeName.startsWith("job::"))
    return typeName.substring("job::".length);

  throw new Error("Encountered job object with no underlying EdgeDb type");
}

/**
 * Assuming the value passed in is a Job as selected from EdgeDb - this
 * returns a string that we could place in a UI badge.
 *
 * @param j
 */
export function jobAsBadgeLabel(j: any): string {
  switch (jobAsType(j)) {
    case "CloudFormationInstallJob":
      return "installing cloud formation";
    case "CloudFormationDeleteJob":
      return "deleting cloud formation";
    case "CopyOutJob":
      return "copying out";
    case "SelectJob":
      return "cohort building";
    default:
      throw new Error("Encountered job object with no badge description");
  }
}
