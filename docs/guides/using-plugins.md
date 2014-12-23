#Using plugins guide

Plugins system is a powerful and simple tool to extend your application with any features and modules.
Also plugins is a native ```fist``` armory designed for easy organize you project files.

Plugins will be executed before application starts. Plugins is a static application extension. If one of them fails during execution then application will nevers started.

##Format
Plugin is a common-js file that should export special interface:

```js
module.exports = function (app /*, done */) {
    // stuff
};
```

First argument is an application instance that provides all necessary tools to extend application. Second argument is a function which you must call if your plugin need asyncronous installation.

##Async plugins
```js
module.exports = function (app, done) {
    setTimeout(function () {
        // defer application start at least for 1 second
        done();
    }, 1000);
};
```

If you call ```done``` with argument, it will be interpeted as error and initialization will be failed. You whatever MUST call ```done``` function if you declare this as parameter, else the application will never started.

If you do not like callbacks like me, but you want asynchronous plugin, yout just should return promise from plugin:

```js
var vow = require('vow');
module.exports = function (app) {
    var defer = vow.defer();
    setTimeout(function () {
        defer.resolve();
    }, 1000);
    return defer.promise();
};
```

##Installation
You should install plugins with 3 ways:
 1. as npm module
 2. as local module
 3. as glob pattern (many plugins)

```js
app.install('my-plugin'); // install plugin as npm module
app.install('/direct/path/to/plugin.js'); // as local module
app.install('/my-plugins/**/*.js');
```

Also your should know that plugins can install other plugins!
```js
module.exports = function (app) {
    app.install('some-plugin1');
    app.install('some-plugin2');
};
```

```some-plugin2``` will be installed after ```some-plugin1``` will be full installed, including children plugins.

How to write execute some code after plugin will be installed?
One way is write two plugins and wrap them around with installed like in example above.
Second way is install dependency an run code in anonymous plugin.
```js
module.exports = function (app, done) {
    app.install('some-plugin1');
    app.plugin(function (app) {
        //  some-plugin1 installed here
        done();
    });
};
```

First way is preferred, it is more clear.

##Usage
Common use case for plugins is installing units. You can provide units by plugins:
```js
module.exports = function (app) {
    app.unit({
        name: 'my-unit'
    });
};
```

Your plugins can provide any number of units in one plugin, but it is stricty recommended to install one unit by one plugin. Two small files are better than one big in common-js land.

##Auto install
You should know that ```fist``` will automatically install any plugins from ```fist_plugins``` directory placed on same level as main module file. I recommend you use this directory to install your project plugins.

##Plugin conflicts
What will happen if two separate plugins will try to install same dependency? 
Plugin system will ignore plugin duplicates, detected by absolute filenames. But you can be confused if the plugins will install the same dependencies from differend npm modules. You MUST specify plugin dependencies as [```peerDependecies```](http://blog.nodejs.org/2013/02/07/peer-dependencies/) in your plugin ```package.json``` to duplicate plugins will be successfully ignored.
