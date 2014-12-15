#Configuration guide

##Configuring core
While you creating your fist application you can pass any object to the factory. This object will be merged with necessary defaults and will be available in app.params.

I guess it is a really convenient. That is you can pass to ```fist()``` not only framework options, but also your application settings.

The settings will be available in any plugin from app function parameter. E.g:

```app.js``` :

```js
var app = require('fist')({
    apiToken: 'asdAlkj120klasdjlkamasdlLKljkl8798d'
});
```

```plugin.js``` :

```js
module.exports = function (app) {
    app.unit({
        name: 'api',
        main: function () {
            // do something with app.params.apiToken
        }
    });
};
```

```Fist``` instance supports some shorthands to pass parameters in aggregated components e.g. [logging](https://github.com/fistlabs/loggin) instance.

```js
var app = require('fist')({
    logging: {
        logLevel: 'WARNING'
    }
});
```

Also I advise you to store all your confuguration at one place in separate file.
```js
var app = require('fist')(require('./configs'));
app.listen(app.params.sock);
```

Is not it clear? It is really enought for app.js! =)

You can ask me, what about any application business logic? Where it will be installed?

I strictly recommend you to do not write any code in your main server-up file. Please, devide your code to plugins.
Now my app.js is done. Next, I want to configure my router.

I just should create plugin file in ```fist_plugins``` directory.
```
app.js
fist_plugins/
    router.js
```
```js
module.exports = function (app) {
    app.route('/' 'index');
    app.route('/news/', 'news');
    app.route('/news/<postId>/', 'post');
};
```

Router plugin is done. Next I should write units to handle my routes. Units also may be installed from plugins.

##Configuring plugins
Once you could see code like that:
```js
app.use(require('some-plugin')({plugin: 'config'}));
```

Fist plugins also supports configuration like above:
```js
app.install('some-plugin', {plugin: 'config'});
```

But i think it is not good. Why do not like below?

```configs.js``` :

```js
module.exports = {
    somePlugin: {
        plugin: 'config'
    }
};
```

```app.js``` :

```js
var app = require('fist')(require('./configs'));
app.install('path/to/some-plugin');
```

```path/to/some-plugin.js``` :

```js
var _ = require('lodash-node');
var defaultSettings = {
    name: 'barney'
};
module.exports = function (app) {
    //  complete plugin settings
    var settings = _.extend(defaultSettings, app.params.somePlugin);
};
```

Is not it more clear? Single place configuration looking good. Plugins may provide default configuration if no configuration directly specified, but it is separate guide.

##Totally
```fistlabs``` recommend you to keep your project configs in one place, excluding really special cases when it makes no sense to keep some constants in global project configuration.

---------
Read [advanced plugin guide](/docs/guides/using-plugins.md)
