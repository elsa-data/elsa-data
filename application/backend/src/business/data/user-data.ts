import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";
import {
  userGetByDbId,
  userGetByEmail,
  userGetBySubjectId,
  UserGetBySubjectIdReturns,
} from "../../../dbschema/queries";
import { AuthenticatedUser } from "../authenticated-user";
import { Executor } from "edgedb";

export type UserDataDbUser = NonNullable<UserGetBySubjectIdReturns>;

/**
 * The UserData is a class wrapping database interactions for users.
 *
 * It must only be used by other Services, and only where the operations/params
 * are known to be valid/allowed. That is, these methods would never
 * be called with unchecked data from the internet (unless the method
 * explicitly says that it can handle it).
 */
@injectable()
export class UserData {
  constructor() {}

  /**
   * Get the current database details of the given user - with
   * the assumption that the user must currently exist. This is used to
   * get the 'latest' permissions settings which may have altered since
   * the user actually logged in.
   *
   * @param executor
   * @param user
   * @throws an Exception if the user is no longer in the database or accessible (should not happen)
   */
  public async getDbUser(
    executor: Executor,
    user: AuthenticatedUser,
  ): Promise<UserDataDbUser> {
    const u = await userGetByDbId(executor, {
      dbId: user.dbId,
    });

    if (!u)
      throw new Error(
        `User with database uuid ${user.dbId} (${user.displayName}) was expected to exist but has disappeared from the database`,
      );

    return u;
  }

  /**
   * Get the current database details of the given user db id - with
   * the assumption that the user must currently exist. This is used to
   * get the 'latest' permissions settings which may have altered since
   * the user actually logged in.
   *
   * @param executor
   * @param dbId
   * @throws an Exception if the user is no longer in the database or accessible (should not happen)
   */
  public async getDbUserByDbId(
    executor: Executor,
    dbId: string,
  ): Promise<UserDataDbUser> {
    const u = await userGetByDbId(executor, {
      dbId: dbId,
    });

    if (!u)
      throw new Error(
        `User with database uuid ${dbId} was expected to exist but has disappeared from the database`,
      );

    return u;
  }

  /**
   * Get the current database details of someone with a subject id. This
   * function throws an exception if the subject id does not exist - so is much
   * more likely to be used from a test where the subject has just been
   * created.
   *
   * @param executor
   * @param subjectId
   * @throws an Exception if the user is no longer in the database or accessible (should not happen)
   * @deprecated only for use in tests
   */
  public async getDbUserBySubjectId(
    executor: Executor,
    subjectId: string,
  ): Promise<UserDataDbUser> {
    const u = await userGetBySubjectId(executor, {
      subjectId: subjectId,
    });

    if (!u)
      throw new Error(
        `User with database subject id ${subjectId} was expected to exist but has disappeared from the database`,
      );

    return u;
  }

  /**
   * Get the current database details of someone with a subject id. This
   * function throws an exception if the subject id does not exist - so is much
   * more likely to be used from a test where the subject has just been
   * created.
   *
   * @param executor
   * @param email
   * @throws an Exception if the user is no longer in the database or accessible (should not happen)
   * @deprecated only for use in tests
   */
  public async getDbUserByEmail(
    executor: Executor,
    email: string,
  ): Promise<UserDataDbUser> {
    const u = await userGetByEmail(executor, {
      email: email,
    });

    if (!u)
      throw new Error(
        `User with database email ${email} was expected to exist but has disappeared from the database`,
      );

    return u;
  }
}
