#Understanding router

Fist application router is a set of request rules assigned to handle request by unit.

When you create route you say to your application "handle request like that with this unit".

##Declaration
```js
app.route('/', {name: 'index');
```

All the routes should have unique name. Route name is required route attribute. But is is not linked unit name. Just by default application assigns the rule to handle request bu the unit with the same name. Because is is common case. By the way, there is a shorthand:

```js
app.route('/', 'index');
```

There are the cases when we need to handle different routes with same controller. But the routes cant have same names. Because it is like ids. You can simply specify the unit name with route definition.

```js
app.route('/', {name: 'index', unit: 'news'});
app.route('/news/', 'news');
```

##Request methods
Fist router supports request method specifying.

```js
app.route('POST /upload/', 'upload_files');
```

By default it is ```GET```. If you route allows ```GET``` requests, it also supports ```HEAD``` automatically.

Also you can specify more than one allowed methods:

```js
app.route('POST,PUT /news/', 'news');
```

If the application server does not allow some method for matched route, but some other routes that also was matched by url and allows this method, it will send ```405``` to client. If the server totally do not support request method, it will send ```501``` to client.

##Router options
You can pass general options to router in ```options.router```

```js
var app = fist({
    router: {
        ignoreCase: true
    }
});
```

Now, all the routes will be case insensitive. But you can override some default options on route level by *flags*

```js
app.route('/ I'); // disable ignoreCase
app.route('/ i'); // enable ignoreCase
```

Any flag, passed in upper case sets related option to ```false```, and to ```true``` if the flag in lower case.
There are two flags:

 * ```i``` - ignoreCase
 * ```s``` - appendSlash
 
It is possible to pass more than one flags:

```js
var app - fist({
    router: {
        ignoreCase: true
    }
});
// Enable "appendSlash" and disable "ignoreCase"
app.route('GET /news/ sI');
```

##Controllers
It would be great to know that anu unit assigned to handle routed request is controller by semantics.

The common case - if during controller execution the response was sent. But if the controller has not send response, the application will try to match any other matched routes.

```js
app.route('/', 'guard');
app.route('/', 'index');
app.unit({
    name: 'guard',
    deps: ['isModerator'],
    main: function (track, context) {
        if (!context.r('isModerator')) {
            track.status(403).send();
        }
    }
});
app.unit({
    name: 'index',
    main: function () {
        //   render moderator page
    }
})
```

The trick above is good way to control page access.

If there are no route matched to the request, or no one controller was send any data to user, application will send ```404```.
