# Logger

We have setup logging infrastructure that is consistent across both
the web server and services. The same logging instance is installed
into the web server _and_ is available for dependency injection.

The logging instance can be configured via our config files, but should
work acceptably out of the box.

## Logger conventions

The logger can accept arbitrary Javascript objects as the first parameter and
will decompose those into fields in the log entry. This should be used
in the first instance for getting debug information

e.g.

```typescript
logger.debug(myComplexObject, "a complex object");
```

For errors (i.e. catch blocks), the first argument being an error object will behave correctly.

## Finding logger

### In Fastify code

Wherever code is running with an available Fastify Request, the logger can
be accessed at

`req.log` i.e. `req.log.debug("A debug message")`

### In service code

Any service can request the use of a logger by listing the logger in
its constructor for dependency injection.

```typescript
constructor(
    @inject("Logger") private readonly logger: Logger,
    usersService: UsersService
  ) {
    ...
}
```

and then used directly as

`this.logger` i.e. `this.logger.debug("A debug message")`
