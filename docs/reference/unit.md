#Unit

The core ide of fist is provide modular application architecture. Modules is units that can inherit from other units and can depend from other units.

The units are decalred by method ```app.unit(Object members, [Object statics])```. Inheritance provided by module [inherit](https://www.npmjs.com/package/inherit).

All units inherits from base unit by default. Lets describe built-in base unit members.

##```String unit.name```
The name of unit

```js
app.unit({
    name: 'foo'
});
```

##```String unit.base=0```
The name of unit to inherit from

```js
app.unit({
    name: 'bar',
    base: 'foo'
});
```

##```* unit.main(Track track, Context context)```
The main method of unit. Should result unit result or send response.

```js
app.unit({
    name: 'slow_foo',
    main: function () {
        var def = vow.defer();
        setTimeout(function () {
            def.resolve('bar');
        }, 1000);
        return defer.promise();
    }
});
```

##```Number unit.maxAge=0```
Enables unit caching if the value is greater than ```0```. It is unit result expiration timeout in seconds.

```js
app.unit({
    name: 'foo',
    maxAge: 5 
})
```

##```Object unit.params={}```
Default unit execution parameters.

```js
app.unit({
    name: 'news',
    params: {
        postId: 42
    },
    main: function (track, context) {
        var postId = context.p('postId');
        //  do stuff with postId
    }
})
```

##```Array unit.deps=[]```
The list of unit names that should be invoked before unit will be executed.

```js
app.unit({
    name: 'rand',
    main: function () {
        return Math.random();
    }
})
app.unit({
    name: 'foo',
    deps: ['rand'],
    main: function (track, context) {
        var rand = context.r('rand');
        //  do stuff with dependency result
    }
});
```

##```Object depsArgs={}```
The object that can provide arguments to pass it to dependencies.

```js
app.unit({
    name: 'get-foo',
    params: {
        foo: 'default'
    },
    main: function (track, context) {
        return context.p('foo');
    }
});

app.unit({
    name: 'index',
    deps: ['get-foo'],
    depsArgs: {
        'get-foo': function (track, context) {
            return {
                foo: 'bar'
            };
        }
    },
    main: function (track, context) {
        var foo = context.r('get-foo'); // "bar"
        
    }
});
```

You also can specify deps args by static objects

```js
app.unit({
    name: 'index',
    deps: ['get-foo'],
    depsArgs: {
        'get-foo': {
            foo: 'bar'
        }
    },
    main: function (track, context) {
        var foo = context.r('get-foo'); // "bar"
        
    }
});
```

##```Object depsMap={}```
The list of unit names overridings

```js
app.unit({
    name: 'foo_bar_zot'
});

app.unit({
    name: 'index',
    depsMap: {
        foo_bar_zot: 'fbz'
    },
    main: function (track, context) {
        var fbz = context.r('fbz');
    }
})
```
##```String unit.cache="local"```
Name of cache, which should be used for cache unit results. Cache instances should be provided in ```app.caches``` attribute.

```js
app.caches.memcached = new Memcached();

app.unit({
    name: 'foo',
    cache: 'memcached',
    maxAge: 42
});
```

##```String unit.identify(Track track, Object args)```
Provides an unique execution key. Override to provide correct cache and memorization ability.

```js
app.unit({
    name: 'foo',
    maxAge: 60,
    identify: function (track, args) {
        return args.foo;  
    },
    //  the result depends on foo parameter
    main: function (track, context) {
        return context.p('foo') * 5;
    }
});
```
