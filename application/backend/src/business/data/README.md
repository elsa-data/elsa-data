Data classes in this folder are classes that expose database functionality
for use ONLY BY INTERNAL CODE. That is, all checks for the validity/permissions
must already have been performed before using these methods.

Essentially, these data classes are the innermost layer of our query
processing (other than the database itself).
