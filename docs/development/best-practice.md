# Best Practice Pointers

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


