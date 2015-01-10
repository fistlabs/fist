#Quick start

This is a quick reference to start writing right now

First, you need to install ```fist``` npm module

```
$ npm install fist
```

Now, you ready to start develop your ```hello world```.

_app.js:_
```js
'use strict';

var fist = require('fist');
var app = fist();

app.listen(1337);
```

Read the full [```Application``` reference](/docs/reference/application.md)

Fist application consists of many modules, called plugins. The plugins placed in fist_plugins directory inside your project will be loaded automatically.

Let's write a plugin that installs a controller unit to the application.

_fist_plugins/units/controllers/hello.js:_

```js
'use strict';

module.exports = function (app) {
    app.unit({
        name: 'hello',
        main: function (track, context) {
            track.send('Hello ' + context.p('name'));
        },
        params: {
            // default
            name: 'nobody'
        }
    });
};
```

[Track](/docs/reference/track.md) is an abstraction over IncomingMesage and ServerResponse. This object is created once for each incoming request.
[Context](/docs/reference/context.md) is a unit execution context. This object is created for each unit invocation and consists of unit dependencies results and execution parameters.

[Read more](/docs/reference/unit.md) about unit interface.

Now, we need to assign the unit to the route. Let's create routes plugin where we will configure all the server routes.

_fist_plugins/routes.js:_
```js
'use strict';

module.exports = function (app) {
    // assign request rule with 'hello' controller
    app.route('GET /hello/(<name>/)', 'hello');
};
```

Read the full [```Router``` reference](/docs/reference/router.md)

That is all. Now we ere only need to ```$ node app.js```

See the [example code](/examples/hello)

--------
This is an ultra short guide. See the full [API reference](/docs/reference/index.md) and [Guides](/docs/guides/index.md) for more details.