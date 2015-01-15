#Power of units

Fist's server request handling runtime consists of set of some scenario parts called units. Each request handled by one unit which can depend on other units. Thus, for processing client's request, fist application starts a tree of unit calls.

This short guide about effective using units.

##Unit dependencies

It is not a secret that any unit may have dependencies. To be precise, unit invocation result may depend on other unit results.
You can specify the dependencies as member of unit constructor prototype object. It should be array:

```js
app.unit({
    name: 'foo',
    deps: ['bar'],
    main: function (track, context) {
        return context.r('bar') + 5;
    }
});
app.unit({
    name: 'bar',
    main: function () {
        return 42;
    }
});
```

The result of unit ```foo``` depends on ```bar``` invocation result. Sure, real cases can be more complex.

##Meaning of ```unit.name```
First ```unit.name``` attribute is just unit identifier. You can use it to assign routes with unit and to specify unit as dependency. You can use it to get unit constructor or instance. But one more function of ```unit.name``` is a path, that will be used to link unit result to dependent execution context.

```js
context.r('bar'); // <- get result of `bar` unit
```

If unit ```bar``` will be rejected that error will be available by ```context.e('bar')```.
By the way, ```context.r``` and ```context.e``` is a just shorthands for ```context.result.get``` and ```context.errors.get```.
See the full [Context object reference](/docs/reference/context.md).

```unit.name``` may should be identifier, but it can contain special syntax constructions, supported by [obus](https://github.com/fistlabs/obus). E.g ```unit.name``` may be a ```"news.list"``` and it should be linked to dependent's ```context.result``` if successfully resolved and to ```context.errors``` if it was rejected, according to given path.

```context.errors``` and ```context.result``` is an ```Obus``` instances, providing you API to deep access to context properties.

```js
context.result.get('news.list');
// instead of
context.result.news.list
```

But you can use both of ways to access property. ```Obus``` api is recommended, because it resistant to ```TypeErrors``` like ```Can not read property "list" of undefined``` and supports default values:

```js
context.result.foo.bar.baz // TypeError
context.result.get('foo.bar.baz') // undefined
context.result.get('foo.bar.baz', 42) // 42
context.r('foo.bar.baz', 42) // 42 - shorter an funnier
```

##Unit inheritance

Any unit can inherit from other unit. We tried to make inheritance maximum unobtrusive and easy to use. Therefore we used [inherit](https://www.npmjs.com/package/inherit).

```js
var vowAsker = require('vow-asker');
app.unit({
    name: 'base_api',
    makeRequestOptions: function (track, context) {
        return {
            method: 'GET',
            host: 'my-backend.org'
        };
    },
    main: function (track, context) {
        return vowAsker(this.makeRequestOptions(track, context));
    }
});
app.unit({
    name: 'fetch_news',
    base: 'base_api',
    makeRequestOptions: function (track, context) {
        var options = this.__base(track, context);
        options.path = '/news/';
        return options;
    }
});
```

```base_api``` is a public unit. Any unit can depend on it. But it will not work standalone because it provides just general request options.

Unit name may starts with ```"_"``` character. It means that unit is abstract, and will be used just only to inherit from that and nobody can depend from it.

```js
var vowAsker = require('vow-asker');
app.unit({
    // base backend api class
    name: '_base_api',
    makeRequestOptions: function (track, context) {
        return {
            method: 'GET',
            host: 'my-backend.org'
        };
    },
    main: function (track, context) {
        return vowAsker(this.makeRequestOptions(track, context));
    }
});
app.unit({
    name: 'fetch_news',
    base: '_base_api',
    makeRequestOptions: function (track, context) {
        var options = this.__base(track, context);
        options.path = '/news/';
        return options;
    }
});
```

Units have some properties that inherits from same properties of its parents. It is like ```deps```. Do not care that ```deps``` will be overwriten by your unit descendant. It will be well merged during inheritance.

```js
app.unit({
    name: 'foo1'
});
app.unit({
    name: 'foo2'
});
app.unit({
    name: 'bar',
    deps: ['foo1']
});
app.unit({
    name: 'baz',
    base: 'bar',
    deps: ['foo2'],
    main: function () {
        assert.deepEqual(this.deps, ['foo1', 'foo2']);
    }
})
```

##Unit mixins
Unit classes supports mixins. Mixins is an ability to provide some kind of multiple inheritance without breaking inheritance tree. With mixins you can give your units some behaviours or interfaces.

```js
var EventEmitter = require('events').EventEmitter;
var vow = require('vow');
app.unit({
    name: 'foo',
    mixins: [EventEmitter],
    __constructor: function () {
        this.__base();
        this.on('exe-end', function () {
            console.log('Execution of %s ends', this.name);
        });
    },
    main: function (track, context) {
        return vow.invoke(function (self) {
            return self.__base(track, context);    
        }, this).always(function (promise) {
            this.emit('exe-end');
            return promise;
        }, this);    
    }
});
```

##Mapping deps
Sometimes you can add to dependencies some unit with crazy name:

```js
app.unit({
    name: 'foo',
    deps: ['some.strange.unit-with_crazy-long.name'],
    main: function (track, context) {
        // hm...
        var dep = context.r('some.strange.unit-with_crazy-long.name');
    }
});
```

So inconvenient to use this dependency. You can rename the dependency unit if it is local. But you cant if it is from external module. There are two ways:

1. Alias
2. Map

```js
//  create alias
app.alias('some.strange.unit-with_crazy-long.name', 'my_short');
```

```js
// Override default result mapping to context
app.unit({
    name: 'foo',
    deps: ['some.strange.unit-with_crazy-long.name'],
    depsMap: {
        'some.strange.unit-with_crazy-long.name': 'my_short'
    },
    main: function (track, context) {
        // done!
        var dep = context.r('my_short');
    }
});
```

##Calling deps with arguments
Sometimes your need to call unit with arguments built in runtime. There are some cases when you can not fetch parameters inside the unit. The example below is unit that should load a news post by its id:

```js
app.unit({
    name: 'post_load',
    main: function (track, context) {
        // load post by `postId` parameter
        return loadPost(context.p('postId'));
    }
});
```

There are two ways to use unit above to load specified post:

1. Static dependency with specified args factory
2. Manual unit invocation (dynamic dependency)

```js
// Calculate deps arguments in runtime
app.unit({
    name: 'post_handler',
    depsArgs: {
        post_load: function (track, context) {
            return {
                postId: <get postId anywhere you want>
            }
        }
    }
});
```

```js
// Manual unit invocation
var vow = require('vow');
app.unit({
    name: 'post_list',
    main: function (track, context) {
        // load three posts
        return vow.all([
            track.invoke('post_load', {postId: 42}),
            track.invoke('post_load', {postId: 43}),
            track.invoke('post_load', {postId: 44})
        ]);
    }
});
```

You should know that fist never do same unit calls during the request. If some unit was already executed then the existing result will be used. But what about the case above when we manually call the same unit for three times? In this case the unit should provide some unique execution criteria to be memorized correctly.

In this situation ```post_load``` is a kind of functional unit. This unit should override default ```identify``` function to provide parameters hashing. It is necessary to provide correct memorization and cache ability.

```js
app.unit({
    name: 'post_load',
    main: function (track, context) {
        // load post by `postId` parameter
        return loadPost(context.p('postId'));
    },
    //   say fist that the result of this unit depends on args.postId
    identify: function (track, context) {
        return context.p('postId');
    }
});
```

Now, ```post_load``` unit will be well-memorized and resistant to same-arguments calls during the request.

----------
* Read [full unit reference](/docs/reference/unit.md)
* Read [cache guide](/docs/guides/using-cache.md)
