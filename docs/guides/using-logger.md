#Using logger

As you could know, fist applications provides logging system. It available by `app.logger`.
It is a [loggin](https://www.npmjs.com/package/loggin) module instance.

While handling request, your application generates tons of contextual logs in different levels.
You can manage it or just disable if you do not want. But be sure, using built-in logger is pretty convenient.
Your application provides you a logger in any context.

##Contextual logs

* `app.logger` - global application logger. You can pass `options.name` to `fist(options)` to give your application name, different from default to create unique application global logging context.

The best place to use `app.logger` is plugin.

```js
//  plugin.js
module.exports = function () {
    app.logger.log('Setting application up!');
    app.foo = 42;
};
```

* `unit.logger` - also static logging context extends `app.logger`. It can be used for logging some unit's daemons.

```js
app.unit({
    name: 'db_connection',
    __constructor: function () {
        var self = this;
        this.__base();
        setInterval(function () {
            self.checkDbConnection();
        }, 5000);
    }
})
```

* `track.logger` - request context logger. If you want to log any actions, happened during request handling, use this logger. It is application logger bound to request context.
Your application uses this logger internally, generally for log some verbose debugging data. But feel free to use it.

```js
app.unit({
    name: 'foo',
    main: function (track) {
        track.logger.log('This message is bound to request!');
    }
});
```

But it will be better to use `context.logger` to log the message above.

* `context.logger` - unit execution runtime context logger. Use this logger to log any actions happened during handling request by unit.

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
        context.logger.log('This message is bound to current unit execution runtime!');
        var logger = context.logger.bind('foo');
        logger.log('Also bound to "foo"');
    }
});
```

##Also
You can fine tune your application logger, it is fantastic flexible. Read the full [loggin documentation](https://github.com/fistlabs/loggin/blob/master/README.md)

---------
Read more:

* [How to configure my app](/docs/guides/configuring.md)
* [Power of units](/docs/guides/power-of-units.md)
