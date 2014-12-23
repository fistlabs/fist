#Context

Context is an object that provides an access to unit execution parameters and dependencies. Laos context provides contextual logger.

##```Logger context.logger```
Contextual [logger](https://www.npmjs.com/package/loggin)

##```Obus context.params```
Execution parameters wrapped in [Obus](https://www.npmjs.com/package/obus) instance.

##```Obus context.errors```
The set of rejected dependencies

##```Obus context.result```
The set of results of resolved dependencies

##```* context.p(String path[, * defaultValue])```
Shorthand for ```context.params.get```

##```* context.r(String path[, * defaultValue])```
Shorthand for ```context.result.get```

##```* context.e(String path[, * defaultValue])```
Shorthand for ```context.errors.get```
