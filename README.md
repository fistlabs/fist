fist [![Build Status](https://travis-ci.org/fistlabs/fist.svg?branch=master)](https://travis-ci.org/fistlabs/fist)
=========

```Fist``` is a [```nodejs```](https://nodejs.org/) framework designed to help create scalable server applications.

#Features
* Loosely coupled architecture
* Plugin system
* Data models
* Thin controllers
* Built-in logging tools
* Built-in cache

#Usage

```
$ npm install fist
```

_app.js:_

```js
var fist = require('fist');
var app = fist();
app.listen(1337);
```

Fist application consists of many modules, called plugins. The plugins placed in ```fist_plugins``` directory inside your project will be loaded automatically.

Let's write a plugin that installs a controller unit to the application.

_fist_plugins/units/controllers/hello.js:_

```js
module.exports = function (app) {
    app.unit({
        name: 'hello',
        main: function (track, context) {
            track.send('Hello ' + context.p('name'));
        },
        params: {
            name: 'nobody'
        }
    });
};
```

Now, we need to assign the unit to the route. Let's create routes plugin where we will configure all the server routes.

_fist_plugins/routes.js:_

```js
module.exports = function (app) {
    app.route('GET /hello/(<name>/)', 'hello');
};
```

```$ node app.js```

See the [full example code](/examples/hello/)

#Docs
* [Quick start](/docs/index.md)
* [Guides](/docs/guides/index.md)
* [API reference](/docs/reference/index.md)

---------
LICENSE [MIT](LICENSE)
