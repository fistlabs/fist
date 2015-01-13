#Quick start

This is a quick reference to start writing right now

Let's write custom face for [https://nodejs.org/api/](https://nodejs.org/api/) as example

_package.json:_

```js
{
  "dependencies": {
    "fist": "3.2",
    "fist-fistlabs_unit_asker": "0.0.1",
    "fist-fistlabs_unit_controller": "0.0.2",
    "jade": "1.8.2",
    "consolidate": "0.10.0",
    "marked": "0.3.2"
  }
}
```

```js
$ npm install
```

Project configuration:

_configs.js:_

```js
module.exports = {
    // port to listen
    port: 1337,
    //  logging settings
    logging: {
        logLevel: 'DEBUG'
    },
    //  unit settings
    unitSettings: {
        //  configuration for `_fistlabs_unit_controller` unit
        _fistlabs_unit_controller: {
            engines: {
                // use jade as common template engine
                jade: require('consolidate').jade
            }
        }
    }
};
```

Read the [configuration guide](/docs/guides/configuring.md)

In the main application file we only need to instantiate the framework and run http server. All plugins will be included automatically.

_app.js:_

```js
var configs = require('./configs');
var fist = require('fist');
var app = fist(configs);
app.listen(app.params.port);
```

It is really enough for main application file.

In our project we need to use some plugins. Let's write the plugin which installs theirs

_fist_plugins/setup.js:_

```js
module.exports = function (app) {
    // do not forget to specify the plugins as dependencies in project package.json
    //  install outgoing http requests helper
    app.install('fist-fistlabs_unit_asker');
    // install base controller
    app.install('fist-fistlabs_unit_controller');
};
```

Read the [plugins guide](/docs/guides/using-plugins.md)

Now we should to create model unit for our documentation pages. The pages are so similar, therefore we only need to create one general model.

_fist_plugins/units/models/document.js:_

```js
module.exports = function (app) {
    app.unit({
        //  inherit from base request helper
        base: '_fistlabs_unit_asker',
        //  unit name
        name: 'document',
        //  default execution parameters
        params: {
            doc: 'index'
        },
        //   use local built-in cache
        cache: 'local',
        //  store cached result for 5 seconds
        maxAge: 5000,
        //  override `_fistlabs_unit_asker`'s method to provide our request options
        options: function (track, context) {
            return {
                hostname: 'nodejs.org',
                // use execution parameter as part of outgoing request part
                path: '/api/' + context.p('doc').toLowerCase() + '.json',
                timeout: 10000
            };
        },
        //  provide unique cache key
        identify: function (track, context) {
            return context.p('doc');
        }
    });
};
```

Now, we ready to write the controller for our page

```js
var marked = require('marked');
module.exports = function (app) {
    app.unit({
        //  inherit from base controller
        base: '_fistlabs_unit_controller',
        //  controller name
        name: 'doc_page',
        //  request rule to emit execution for this unit (feature of base controller)
        rule: 'GET /(<doc>.html) i',
        //  execution dependencies
        deps: ['document'],
        //  view name (base controller feature)
        defaultViewName: 'doc_page.jade',
        //  override main execution function to handle possible errors
        main: function (track, context) {
            var error = context.e('document');
            if (error) {
                if (context.e('document.data.statusCode') === 404) {
                    return track.status(404).send();
                }
                //  unknown error
                throw error;
            }
            //  Need to use marked module in our jade templates.
            //  Add it to context which will pe passed to view template
            context.md = marked;
            //  Cass base method to render template
            this.__base(track, context);
        }
    });
};
```

Now we only need to create [_views/doc_page.jade_](/examples/njsdoc/views/doc_page.jade).

```js
$ node app.js
```

--------
See the full [example code](/examples/njsdoc)
See the full [API reference](/docs/reference/index.md) and [Guides](/docs/guides/index.md) for more details.
