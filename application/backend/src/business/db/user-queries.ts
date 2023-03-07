import e, { $infer } from "../../../dbschema/edgeql-js";

/**
 * Return the details of a single user.
 */
export const singleUserBySubjectIdQuery = e.params(
  { subjectId: e.str },
  (params) =>
    e
      .select(e.permission.User, (u) => ({
        ...e.permission.User["*"],
        filter: e.op(params.subjectId, "=", u.subjectId),
      }))
      .assert_single()
);

export type SingleUserBySubjectIdType = $infer<
  typeof singleUserBySubjectIdQuery
>;

/**
 * Return the details of a single user searching by email.
 */
export const singleUserByEmailQuery = e.params({ email: e.str }, (params) =>
  e
    .select(e.permission.User, (u) => ({
      ...e.permission.User["*"],
      filter: e.op(params.email, "=", u.email),
    }))
    .assert_single()
);

/**
 * Return the details of a single user searching by email.
 */
export const singlePotentialUserByEmailQuery = e.params(
  { email: e.str },
  (params) =>
    e
      .select(e.permission.PotentialUser, (pu) => ({
        ...e.permission.PotentialUser["*"],
        futureReleaseParticipant: {
          id: true,
        },
        filter: e.op(params.email, "=", pu.email),
      }))
      .assert_single()
);

export const deletePotentialUserByEmailQuery = e.params(
  { email: e.str },
  (params) =>
    e.delete(e.permission.PotentialUser, (pu) => ({
      filter: e.op(params.email, "=", pu.email),
    }))
);

/**
 * A count of all users.
 */
export const countAllUserQuery = e.count(e.permission.User);

/**
 * A pageable EdgeDb query for all users.
 */
export const pageableAllUserQuery = e.params(
  { limit: e.int32, offset: e.int32 },
  (params) =>
    e.select(e.permission.User, (u) => ({
      ...e.permission.User["*"],
      // we need a stable ordering to allow our paging to be consistent
      order_by: [
        // we want those with any admin like permissions to appear first
        {
          expression: e.op(
            e.op(u.allowedImportDataset, "or", u.allowedCreateRelease),
            "or",
            u.allowedChangeReleaseDataOwner
          ),
          direction: e.DESC,
        },
        {
          expression: u.displayName,
          direction: e.ASC,
        },
        {
          expression: u.subjectId,
          direction: e.ASC,
        },
      ],
      limit: params.limit,
      offset: params.offset,
    }))
);
