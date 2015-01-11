#Using plugins guide

Plugin system is a powerful and simple tool to extend your application and organize your project files.

Plugins will be executed before application starts. Plugins is a static application extensions. If one of them fails during the execution then application will never started.

##Format
Plugin is a common-js file that should export special interface:

```js
module.exports = function (app /*, done */) {
    // stuff
};
```

First argument is an application instance. Second argument is a function which you must call if your plugin need asynchronous installation.

##Async plugins
```js
module.exports = function (app, done) {
    setTimeout(function () {
        // defer application start at least for 1 second
        done();
    }, 1000);
};
```

If you call ```done``` with argument, it will be interpreted as error and initialization will be failed. You MUST call ```done``` function if you declare this as parameter, else the application will never started.

If you do not like callbacks like me, but you want asynchronous plugin, you just should return promise from plugin:

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
You should install plugins with 3 ways:
 1. From node_modules
 2. From local common-js module
 3. By glob pattern (a few local modules in one time)

```js
app.install('my-plugin'); // install plugin from node_modules
app.install('/direct/path/to/plugin.js'); // as local module
app.install('/my-plugins/**/*.js');
```

Also your should know that plugins can install other plugins.
```js
module.exports = function (app) {
    app.install('some-plugin1');
    app.install('some-plugin2');
};
```

```some-plugin2``` will be installed after ```some-plugin1``` will be fully installed, including children plugins.

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

Your plugins can provide any number of units in one plugin, but it is strictly recommended to install one unit by one plugin. Two small files are better than one big in common-js land.

##Auto install
You should know that ```fist``` will automatically install any plugins from ```fist_plugins``` directory placed on same level as main module file. I recommend you use this feature to install your project plugins.

##Plugin conflicts
What will happen if two separate plugins will try to install same dependency? 
Plugin system will ignore plugin duplicates, detected by absolute file names.

Use [```peerDependencies```](http://blog.nodejs.org/2013/02/07/peer-dependencies/) npm packages feature to prevent double plugin installation and do not forget to specify ```fist``` there.

Let's we want to install plugins A and B in our app. Both of A and B depends on C.

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
