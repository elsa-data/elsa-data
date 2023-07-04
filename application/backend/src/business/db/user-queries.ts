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
