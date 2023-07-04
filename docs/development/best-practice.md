# Best Practice Pointers

## User Permissions

All users have a permission set (boolean fields) that exist in their EdgeDb User.

On login, this permission set is used to give the front end a list of rights. However,
due to the desire for the permissions to be immediately responsive (i.e if an
admin _removes_ the rights from a user we want that to apply immediately) -
the back end _always_ uses the permissions current in the database at the point of operation.

What does this mean in practice? It means that the AuthenticatedUser which proves
who is logged in to the backend - and is maintained in the session - does not itself
have any permissions information.

Permissions need to be resolved in the service operation using
one of the following techniques as appropriate.

- Integrate the authorisation decisions into the query itself - so an Edgeql query
  that takes the `userDbId` as a parameter and changes the results based on the permissions -
  see for instance `auditEventGetSomeByUser.edgeql`
- Opportunistically get the permissions as part of the boundary checks of the service
  as these possibly already hit the User table of the database - see for instance
  `releaseGetBoundaryInfo.edgeql`
- Explicitly use the `UserData` data class to look up the user in the database
  and make the corresponding authorisation decision

## EdgeDb

### Paging

There is a style to EdgeQL queries that allows a minimum of repetition of field names, and which allows
the computation of both a 'page' of data and the total count of all entries for the view.

That is, we can count that there are 100 filtered 'Releases' via some set of criteria, but also only
return a page showing the last 10 of these.

Here we see that the `with` clause defines the base filter criteria for the view, and the free shape
select allows that view to be used both for paging and for counting.

https://github.com/umccr/elsa-data/blob/dev/application/backend/dbschema/queries/release/releaseGetAllByUser.edgeql

The use of optional paging parameters to the query means that if 'limit' and 'offset' are not specified, the entire view
is returned.

## Audit Log

## UI Tables
