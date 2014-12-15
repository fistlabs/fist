#Using unit dependencies ability

It is not a secret that any unit may have dependencies. To be precise, unit invocation result may depends on other unit results.
You can sepcify the dependencies as member of unit constructor prototype object. It should be array:

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

The result of unit ```foo``` depends on ```bar``` invocation result. Sure, real cases are more difficult.

##Meaning of ```unit.name```
First ```unit.name``` attribute is just unit identifier. You can use it to assign routes with unit and to specify unit as dependency. You can use it to get unit constructor or instance. But one more function of ```unit.name``` is a path, that will be used to link unit result to dependent execution context. Note the example above.

```js
context.r('bar'); // <- get result of `bar` unit
```

If unit bar will be rejected that error will be available by ```context.e('bar')```.
By the way, ```context.r``` and ```context.e``` is a just shorthands for ```context.result.get``` and ```context.errors.get```.
See the full [Context object reference](/docs/reference/context.md).

```unit.name``` may should be identifier, but it can contain special syntax constructions, supported by [obus](https://github.com/fistlabs/obus). E.g ```unit.name``` may be a ```"news.list"``` and it should be linked to dependent's ```context.result``` as
```js
{
    news: {
        list: <... result ... >
    }
}
```
if successfully resolved and to ```context.errors``` if it was rejected. 
```context.errors``` and ```context.result``` is an ```Obus``` instances, providing you API to deep access to context properties.

```js
context.result.get('news.list');
// instead of
context.result.news.list
```

But you can use both of methods to access property. ```Obus``` api is recommended, coz resistant to TypeErrors like ```Can not read property "list" of undefined``` and supports default values:
```js
conetxt.result.foo.bar.baz // TypeError
context.result.get('foo.bar.baz') // undefined
context.result.get('foo.bar.baz', 42) // 42
context.r('foo.bar.baz', 42) // 42 - shorter an funnier
```

Unit name may starts with ```"_"``` character. It means that units is abstract and used just for inherit from that, but nobody can depend from that.

```js
app.unit({
    name: '_base_api',
    deps: ['foo'],
    main: function (track, context) {
        var foo = context.r('foo');
        //  do base stuff with foo
    }
});

app.unit({
    base: '_base_api',
    name: 'get-users',
    deps: ['bar'],
    main: function (track, context) {
        var baseResult = this.__base(track, context);
        var bar = context.r('bar');
        //  do stuff with baseResult and bar
    }
});
```

Inheritance provided by [inherit](https://www.npmjs.com/package/inherit) module.
Do not worry about ```get-users``` unit will override base deps, because it will be automatically merged during inheritance.

Also do not care that mixins will override your deps, theirs deps will also be merged with yourth.

```js
app.unit({
    name: 'foo',
    deps: ['bar'],
    mixins: [...],
    main: function (track, context) {
        // du stuff with context.result.bar
    }
});
```

##Mapping deps
Sometimes you can add to dependencties some unit with crazy name:
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
Sometimes your need to call unit many times with different arguments:

```js
app.unit({
    name: 'post_load',
    main: function (track, context) {
        // load post by post.id parameter
        return loadPost(context.p('post.id'));
    }
});
```

There are two ways to load specified post:
1. static dependency with specified args factory
2. manual unit invocation

```js
app.unit({
    name: 'post_handler',
    depsArgs: {
        post_load: function (track, context) {
            //  you can calculate args dynamically
            return {
                post: {
                    id: Math.round(42 * Math.random())
                }
            }
        }
        //, // static arguments
        //post_load: {
        //    post: {
        //        id: 42
        //    }
        //}
    }
});
```

Convenient case but not always anough.

```js
var vow = require('vow');
app.unit({
    name: 'post_list',
    main: function (track, context) {
        return vow.all([
            track.invoke('post_load', {post: {id: 42}}),
            track.invoke('post_load', {post: {id: 43}}),
            track.invoke('post_load', {post: {id: 44}})
        ]);
    }
});
```

The second way should be used carefully.
It this situation post_load is a functional unit. This unit should override default ```identify``` function to provide supporting parameters hashing. It is necessary to provide correct memorization and cache ability.

```js
app.unit({
    name: 'post_load',
    main: function (track, context) {
        // load post by post.id parameter
        return loadPost(context.p('postId'));
    },
    identify: function (track, args) {
        return args.postId;
    }
});
```

Now, ```post_load``` unit will be well-memorized and resistant to same-arguments calls during one request.

----------
Read [full Unit reference](/docs/reference/unit.md)
Read [cache guide](/docs/guides/using-cache.md)
