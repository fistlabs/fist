#Application

##```Server fist([Object options])```
Creates new application instance

###```* options.trustProxy='loopback'```
Configuration of trusted proxies. See [proxyAddr.compile](https://github.com/jshttp/proxy-addr#proxyaddrcompileval) documentation

```js
var app = fist({
    trustProxy: '127.0.0.1'
});
```
###```Object options.router={}```
Router configuration. See [Finger Rule options](https://github.com/fistlabs/finger#object-options) documentation

```js
var app = fist({
    router: {
        ignoreCase: true,
        appendSlash: true
    }
});
```
###```String options.root=path.dirname(require.main.filename)```
Application root directory. Used to find application plugins.

```js
var app = fist({
    root: process.cwd()
});
```
###```String options.implicitBase=0```
Implicit base unit name. ```0``` is base unit name.

```js
var app = fist({
    implicitBase: 'my_base'
});

app.unit({
    base: 0,
    name: 'my_base',
    foo: 'bar'
});

//  will be inherited from `my_base`
app.unit({
    name: 'index'
});
```

##```Server app.route(String rule, Object data);```
Assing request rule to handle with unit.

```js
app.route('/', {name: 'index'}); // create route "index", implicitly linked to "index" unit.
app.route('/', 'index'); // same as example above, but shorter
app.route('/', {name: 'index', unit: 'foobar'}); // create route index explicitly linked to "foobar" unit.
```

##```HttpServer app.listen(...)```
Start listening incoming connections. The signature is same as [Node's Server listen](http://nodejs.org/api/http.html#http_class_http_server). Returns original server object.

```js
app.listen(80);
```

##```Function app.getHandler()```
Returns the callback for [```http.createServer```](http://nodejs.org/api/http.html#http_http_createserver_requestlistener) function. Designed for using with custom servers. 

```js
http.createServer(app.getHandler()).listen(80);
```

##```Promise app.ready()```
Compiles application logic and starts initialization.

```js
app.ready();
```

Note that ```app.ready()``` will be called automatically if you call ```app.listen()```

##```Server app.unit(Object prototype)```
Schedules unit initialization.

```js

app.unit({
    name: 'foo'
});
```

##```Server app.alias(String base, String name)```
Creates an alias for ```base``` unit
```js
app.unit({
    name: 'long-long-long-hard-to-type-unit-name'
});

app.alias('long-long-long-hard-to-type-unit-name', 'foo');
```

##```Server app.alias(Object aliases)```
Same as ```app.alias(String base, String name)``` but supports many aliases in one time.

```js
app.alias({
    base_name1: 'alias_name1',
    base_name2: 'alias_name2'
});
```

###```Server app.plugin(Function plugin)```
Adds inline anonymous plugin

```js
app.plugin(function startDelay(app, done) {
    setTimeout(function () {
        done();
    }, 100);
});
```

###```Server app.install(String moduleName)```
Install the plugins

```js
app.install('npm_module_name'); // install plugin as npm module
app.install('/direct/path/to/plugin.js'); // install plugin from local module
app.install('/my_plugins/**/*.js'); // install many local plugins (Glob)
```

###```Logger app.logger```
Global root logger.

```js
app.logger.log('Starting worker');
```

###```Object app.params```
Application parameters. Implicit + explicit

```js
var app = fist({foo: 'bar'});

app.params.foo; // "bar"
app.params.trustProxy; // "loopback"
```
