import e, { $infer } from "../../dbschema/edgeql-js";

const singleUserQuery = e
  .select(e.permission.User, () => ({ id: true, subjectId: true }))
  .assert_single();

type SingleUserResult = $infer<typeof singleUserQuery>;

export class AuthenticatedUser {
  constructor(private readonly dbUser: SingleUserResult) {
    if (this.dbUser == null)
      throw new Error(
        "Cannot instantiate a AuthenticatedUser with a null database record"
      );
  }

  public get subjectId(): string {
    return this.dbUser!.subjectId;
  }
}
