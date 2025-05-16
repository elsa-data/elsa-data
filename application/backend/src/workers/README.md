Workers are entry points of functionality that running in a separate Worker
context. That is, they are started as background tasks by the main
application and run continuously whilst ever the main thread is
running.

These entry points may need to be called out explicitly in the build/runtime
systems - to declare that they are alternative launch points (so be
careful renaming them without considering the entire build).
