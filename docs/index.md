#Quick start

This is a quick reference to start writing right now

##Creating an application
```js
var fist = require('fist');
var app = fist();
app.listen(1337);
```
Your application server is done

Read the full [```Application``` reference](/docs/reference/application.md)

##Creating unit
```js
app.unit({
    name: 'news', // <- name of the unit
    main: function (track, context) {
        /*
            It is a main method that will be called during unit invocation.
            Track is a IncomingMessage+ServerResponse abstraction.
            Context is a unit execution context.
        */
        track.send('Okay');
    }
});
```

See all unit features at [```Unit``` reference](/docs/reference/unit.md), also [```Track``` reference](/docs/reference/track.md) and [```Context``` reference](/docs/reference/context.md)

##Handling requests
```js
app.route('/news/'/* route pattern */, 'news' /* Route name (unit name) */);
```

```Fist``` uses [```Finger```](https://github.com/fistlabs/finger) as router. See the full pattern writing reference there.
But it is important to know that ```fist``` uses extended version of ```Finger``` supporting describing request methods.

Read the full [```Router``` reference](/docs/reference/router.md)

##Unit dependencies
Any unit may have dependencies
```js
app.unit({
    name: 'news',
    deps: ['news.list'],
    main: function (track, context) {
        var error = context.e('news.list'); 
        //  check if `news.list` was errorer
        if (error) {
            track.status(500).send(error);
        } else {
            track.send(context.r('news.list'));
        }
    }
});

app.unit({
    name: 'news.list',
    //  Cache result for 5 seconds
    maxAge: 5,
    main: function (track, context) {
        return [
            // news list
        ];
    }
});
```
[Read](/docs/guides/using-cache.mg) the full cache guide also [Effective using dependencies](/docs/guides/using-deps.md) guide

##Writing plugin
Create file ```<app-root>/fist_plugins/my-plugin.js```
```js
module.exports = function (app) {
    // E.g installing unit from plugin
    app.unit({
        name: 'news.list'
    });
};
```

The plugins from ```fist_plugins``` directory will be installed automatically.
Read [Plugin guide](/docs/guides/using-plugins.md)

--------
This is an ultra short guide. See the full [API reference](/docs/reference/index.md) and [Guides](/docs/guides/index.md) for more details.
