#Understanding router

Fist application router is a set of request rules assigned to handle request by unit.

When you create route you say to your application "handle request like that with this unit".

Routing provided by [finger](https://www.npmjs.com/package/finger) module.

##Declaration

```js
app.route('/', 'index');
```
The first argument is request rule, the second - route name. Route name is an unique route identifier. All the routes should have unique name. Route name is required route attribute. By default fist assigns the unit with the same name to handle request matched to this route because it is common case.

```js
app.route('/', 'index');
app.unit({
    name: 'index'
});
```

But route's name and unit's name is not the same. It is just shorthand.

```js
app.route('/', {
    // route name
    name: 'index'
});
```

the code above is same as following:

```js
app.route('/', {
    // route name
    name: 'index',
    // unit name
    unit: 'index'
});
```

and the same as this:

```js
app.route('/', 
    // handle "index" route with "index" unit
    'index');
```

There are the cases when we need to handle different routes with same controller. But the routes can not have same names. You can simply specify the unit name with route definition.

```js
app.route('/', {
    name: 'index',
    unit: 'news'
});
app.route('/news/', 'news');
```

##Request methods
Fist router supports request method specifying.

```js
app.route('POST /upload/', 'upload_files');
```

By default it is ```GET```. If your route allows ```GET``` requests, it also supports ```HEAD``` automatically.

Also you can specify more than one allowed methods:

```js
app.route('POST,PUT /news/', 'news');
```

If the application server does not allow some method for matched route, but some other routes that also was matched by url and allows this method, it will send ```405``` to client. 

If the server totally do not support request method, it will send ```501``` to client.

If you want to match all the request methods with url pattern, you should specify asterisk instead of methods list:

```js
app.route('* /', 'index');
```

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
app.route('/ I', 'index'); // disable ignoreCase
app.route('/ i', 'index'); // enable ignoreCase
```

Any flag, passed in upper case sets related option to ```false```, and to ```true``` if the flag is in lower case.

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

##Base path support

Router supports base url path for application.

```js
var app = fist({
    router: {
        basePath: '/blog'
    }
});
app.route('GET /post/<postId>');
```

It means that you should not add `/blog` for any route, fist will add it automatically.
```
GET /blog/post/42 - 200
GET /post/42 - 404
```

Also it affecting to redirects.

```js
var app = fist({
    router: {
        basePath: '/blog'
    }
});
app.route('GET /', 'index');
app.unit({
    name: 'index',
    main: function () {
        track.redirect('/feed', 302);
    }
});
```

```
GET /blog/ - 302 (/blog/feed)
```

##Controllers
It would be great to know that anu unit assigned to handle routed request is controller by semantics.

The common case - if during controller execution the response was sent. But if the controller has not send response, the application will try to match any other matched routes.

```js
app.route('* /', 'guard');
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
});
```

The trick above is good way to control page access.

If there are no route matched to the request, or no one controller was send any data to user, application will send ```404```.

_Read the full [finger reference](https://github.com/fistlabs/finger/blob/master/README.md)_

----------
Read more
* [Power of units](/docs/guides/power-of-units.md)
* [Using plugins](/docs/guides/using-plugins.md)
