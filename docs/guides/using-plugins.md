#Using plugins guide

Plugin system is a powerful and simple tool to extend your application and organize your project files.

Plugins will be executed before application starts. Plugins is a static application extensions. If one of them fails during the execution then the application will never started.

##Format
Plugin is a common-js file that should export special interface:

_fist_plugins/example.js_

```js
module.exports = function (app /*, done */) {
    // stuff
};
```

Easy.
Plugin's file name does not mean anything.

The first argument is an application instance. The second argument is a function which you must call if your plugin needs asynchronous installation.

The main goal of plugins is setting up your application. E.g installing units, configuring, providing any interfaces, anything.

```js
module.exports = function (app) {
    app.myFeature = 42;
};
```

Why not?

##Async plugins
Sometimes we need to install some plugin asynchronously. E.g. I want to compile and install my html-templates.

```js
var myCompileTool = require('<someTool>');
module.exports = function (app, done) {
    myCompileTool.compile(app.params.myProjectTemplatesLocation, done);
};
```

If it  call ```done``` with argument, it will be interpreted as error and initialization will be failed. You MUST call ```done``` function if you declare it as parameter, else the application will never started.

If you do not like callbacks like me, but you want asynchronous plugin, you just should return a promise from the plugin:

```js
var vow = require('vow');
module.exports = function (app) {
    var defer = vow.defer();
    setTimeout(function () {
        // defer application start for a second
        defer.resolve();
    }, 1000);
    return defer.promise();
};
```

##Installation
You can install plugins with 3 ways:

###From node_modules

```js
app.install('my-plugin'); // install plugin from node_modules
```

Fist will not download the packages from npm registry, the packages should be installed first.

###From a local common-js module

```js
app.install('/direct/path/to/plugin.js'); // as local module
```
It is just path to plugin's ```*.js``` file. Fist will resolve the filenames from ```app.params.root```

###By glob pattern

```js
app.install('/my-plugins/**/*.js');
```

It is like single plugin installation, but this way allows you to install a few plugins in one time. 

Also your should know that plugins can install other plugins.

_fist_plugins/setup.js:_

```js
module.exports = function (app) {
    app.install('some-plugin1');
    app.install('some-plugin2');
};
```

```some-plugin2``` will be installed after ```some-plugin1``` will be fully installed, including children plugins.

```fist_plugins/setup.js``` is the best way to install all external plugins to your application.

How to execute some code after plugin will be installed?
One way is write two plugins and wrap them around with installed like in example above.
Second way is install dependency and run code in anonymous plugin.

```js
module.exports = function (app, done) {
    app.install('some-plugin1');
    app.plugin(function (app) {
        //  some-plugin1 installed here
        done();
    });
};
```

##Usage
Common use case for plugins is installing units. You can provide units by plugins:

```js
module.exports = function (app) {
    app.unit({
        name: 'my-unit'
    });
};
```

Your plugins can provide any number of units in one plugin, but it is strictly recommended to install one unit by one plugin. Two small reusable modules are better than one big code blob in common-js land.

##Auto install
You should know that ```fist``` will automatically install any plugins from ```fist_plugins``` directory placed on same level as main module file. I recommend you to use this feature to install your project plugins.

##Plugin conflicts
What will happen if two separate plugins will try to install same dependency? 
Plugin system will ignore plugin duplicates, detected by absolute file names.

Use [```peerDependencies```](http://blog.nodejs.org/2013/02/07/peer-dependencies/) npm packages feature to prevent double plugin installation and do not forget to specify ```fist``` there.

Suppose we want to install plugins A and B in our app. Both of A and B depends on C.

You will get bad setup if you will not be used peer dependencies:

```
app(A,B)
    A(C)
        C
    B(C)
        C
```

Plugin C will be installed a twice.

Using peer dependencies:

```
app(A,B)
    A(C)
    B(C)
    C
```

---------
Read more: [Power of units](/docs/guides/power-of-units.md)
