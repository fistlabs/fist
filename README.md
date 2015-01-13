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

_fist_plugins/routes.js:_

```js
module.exports = function (app) {
    app.route('GET /hello/(<name>/)', 'hello');
};
```

```$ node app.js```

See the [full example code](/examples/hello/)

#[Quick start](/docs/index.md)

#Docs
* [Guides](/docs/guides/index.md)
* [API reference](/docs/reference/index.md)

---------
LICENSE [MIT](LICENSE)
