#Using logger

As you could know, fist applications provides logging system. It available by ```app.logger```. 
It is a [loggin](https://www.npmjs.com/package/loggin) module instance.

While handling request, your application generates tons of contextual logs in different levels.
You can manage it or just disable if you do not want. But be sure, using built-in logger is pretty convenient.
Your application provides you a logger in any context.

##Contextual logs

* ```app.logger``` - global application logger. You can pass ```options.name``` to ```fist(options)``` to give your application name, different from default.

The best place to use ```app.logger``` is plugin.

```js
//  plugin.js
module.exports = function () {
    app.logger.log('Setting application up!');
    app.foo = 42;
};
```

* ```track.logger``` - request context logger. If you want to log any actions, happened during request handling, use this logger. It is application logger bound to request context.
Your application uses this logger internally, generally for log some verbose debugging data. But feel free to use it.

```js
app.unit({
    name: 'foo',
    main: function (track) {
        track.logger.log('This message is bound to request!');
    }
});
```
But it will be better to use ```context.logger``` to log the message above.

* ```context.logger``` - unit execution runtime context logger. Use this logger to log any actions happened during handling request by unit.

```js
app.unit({
    name: 'foo',
    main: function (track, context) {
        context.logger.log('This message is bound to current unit runtime!');
    }
});
```

Also, you can create your own contexts for logger if there are not enough.

```js
app.unit({
    name: 'foo',
    main: function (track, context) {
        context.logger.log('This message is bound to current unit runtime!');
        this.foo(track, context);
        this.bar(track, context);
    },
    foo: function (track, context) {
        var logger = context.logger.bind('foo');
        logger.log('Bound to current runtime and foo');
        //  do stuff
    },
    bar: function (track, context) {
        var logger = context.logger.bind('bar');
        logger.log('Bound to current runtime and bar');
        //  do stuff
    }
});
```

##Also
You can fine tune your application logger, it is fantastic flexible. Read the full [loggin documentation](https://github.com/fistlabs/loggin/blob/master/README.md)
