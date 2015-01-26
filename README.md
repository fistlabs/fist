fist the framework [![Build Status](https://travis-ci.org/fistlabs/fist.svg?branch=master)](https://travis-ci.org/fistlabs/fist)
=========

`Fist` is a [`nodejs`](https://nodejs.org/) framework designed to help create scalable server applications.

##What do I get?

#####Plugin system
_Modular application structure. Automatic project files loading._

```
fist_plugins/
    models/
        user.sessionid.js
        news.list.js
        news.available_list.js
    controllers/
        news_page.js
```

#####Loosely coupled architecture
_Focus on unit development. Encapsulated business logic._

```js
app.unit({
    name: 'news.available_list',
    deps: ['news.list', 'user.sessionid'],
```

#####Data models
_Simple and intuitive data structures. Unobtrusive data typing._

```js
{
    errors: {},
    result: {
        news: {
            available_list: [
                {
                    type: "post",
                    visibility: "all",
```

#####Thin controllers
_Just check that your models are valid._

```js
app.unit({
    name: 'news_page',
    deps: ['news.available_list'],
    main: function (track, context) {
        if (context.e('news.available_list')) {
            track.status(500).send();
```

#####Built-in logging tools
_Always clear what happening and where. More reliability._

```js
app.unit({
    name: 'user.sessionid',
    main: function (track, context) {
        context.logger.debug('Starting to check session by cookie\n"%s"', track.cookie('sessid'));
```

#####Built-in cache
_Just specify what parts of your program can be cached. Less loading. More responsiveness._

```js
app.unit({
    name: 'news.list',
    maxAge: 5000,
```

##Hello, world!

```bash
$ npm install fist
```

_app.js:_

```js
var fist = require('fist');
var app = fist();
app.listen(1337);
```

_fist_plugins/routes.js:_

```js
module.exports = function (app) {
    app.route('GET /hello/(<name>/)', 'hello_page');
};
```

_fist_plugins/controllers/hello_page.js:_

```js
module.exports = function (app) {
    app.unit({
        name: 'hello_page',
        deps: ['greeting_data'],
        main: function (track, context) {
            track.send(context.r('greeting_data.helloText'));
        }
    });
};
```

_fist_plugins/models/greeting_data.js:_

```js
module.exports = function (app) {
    app.unit({
        name: 'greeting_data',
        main: function (track, context) {
            return {
                helloText: 'Hello, ' + context.p('name')
            };
        },
        params: {
            name: 'what is your name?'
        }
    });
};
```

```bash
$ node app.js
```

See the [full example code](/examples/hello/)

###[Quick start](/docs/index.md)

##Docs
* [Guides](/docs/guides/index.md)
* [API reference](/docs/reference/index.md)

---------
LICENSE [MIT](LICENSE)
