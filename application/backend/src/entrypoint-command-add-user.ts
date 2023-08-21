import { DependencyContainer } from "tsyringe";
import * as edgedb from "edgedb";
import { potentialUserGetByEmail, userGetByEmail } from "../dbschema/queries";
import e from "../dbschema/edgeql-js";

export const ADD_USER_COMMAND = "add-user";

/**
 * Command instructing the addition of a potential user record that will then allow login.
 * Normally, users can be added by being involved in a release - but for bootstrapping
 * admin users this may be used.
 *
 * @param dc the dependency container
 * @param userEmail the user email to add
 */
export async function commandAddUser(
  dc: DependencyContainer,
  userEmail: string
): Promise<void> {
  const edgeDbClient: edgedb.Client = dc.resolve("Database");

  await edgeDbClient.transaction(async (tx) => {
    // we want this to be safe... so if the user already exists we just silently pass
    const actualDbUser = await userGetByEmail(tx, {
      email: userEmail,
    });

    if (actualDbUser) return;

    const potentialDbUser = await potentialUserGetByEmail(tx, {
      email: userEmail,
    });

    if (potentialDbUser) return;

    await e
      .insert(e.permission.PotentialUser, {
        email: userEmail,
      })
      .run(tx);
  });
}
