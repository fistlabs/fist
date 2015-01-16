#Using cache

```Fist``` provides automatic cache ability. All you should now about cache is:

* ```Object app.caches```
* ```Function unit.identify```
* ```Number unit.maxAge```
* ```String unit.cache```

It is your main tools to provide caching of your units.

First, ```app.caches```. It is an object, containing cache engines instances by keys as instance names. By default there are just ```"local"``` cache. Local cache is a fast local lru-cache.

If you want any other cache mechanism your should provide an object with supported interface:

```js
cache.get(String key, Function done);
cache.set(String key, * value, Number ttl, Function done);
```
```key``` is a key for caching value both for get and set
```value``` in set method is a value that should be cached
```ttl``` max age of current cache entry (Seconds). It should be a Number.
```done``` done callback should be called with (error) as single argument id operation was failed or as (null, result) if operation successfully done. Both for ```get``` and ```set```.

E.g. you can get [memcached](https://www.npmjs.com/package/memcached) client that provides that interface by default.
Then you need to add this object to ```app.caches```:

Example as plugin:

_fist_plugins/setip.js:_

```js
var Memcached = require('memcached');
module.exports = function (app) {
    app.caches.memcached = new Memcached(app.params.memcached);
};
```

Okay, you have your own cache interface. Next you should say unit to use this instance. It is ```unit.cache``` property.
By default it is ```"local"```, you may do not specify ```unit.cache``` property if ```local``` cache is suitable.

```js
app.unit({
    name: 'foo',
    cache: 'memcached'
});
```

Now unit knows that it should use ```memcached``` instance, but to enable cache you should specify ```unit.maxAge > 0```:

```js
app.unit({
    cache: 'memcached',
    name: 'foo',
    maxAge: 5 // cache for 5 seconds
});
```

done! Now, unit ```foo``` will be cached for 5 seconds.

##Cache key
```Unit``` have special method ```unit.identify(track, context)```. It should provide unique key as string containing a criteria affecting to results. If your unit use any execution parameters that you must override this method to avoid cache collisions and other hard-to-find application bugs.

In other words this method should return result identity for current call. Returned value will be used to generate cache key. You should not be care about unit deps inside this method. Their keys will be used for generate cache key. By default this method returns ```"static"``` String.

```js
app.unit({
    name: 'foo',
    maxAge: 5,
    main: function (track, context) {
        return context.p('x') * 42;
    },
    identify: function (track, context) {
        return context.p('x');
    }
});
```

Note that not any result can be cached. E.g. if unit was rejected, the error will not be cached. Also if unit sends response to client, the value can not be cached.

Unit execution result directly depends on its deps results. Because of that unit result can not be cached if one dependency will not enable cache, will be rejected, sent data or was outdated. Unit result can not be cached on time bigger than its dependencies.

There are many restrictions, but it is all to avoid many problems with incorrect caching.

##Also
You should know that ```unit.identify``` used not only for generating cache keys. Identity also used for unit invocations memorization during the request handling runtime. You can call your units with different arguments, and in this case you should correctly provide this method.

##Totally
Use cache! But be careful with generating keys. Use local cache for simple dependencies, e.g. some parsers, helpers. It is makes no sense to store its results in memcached or database. Use memcached for caching http-apis, returning static data, eg. news, articles. Do not use cache for dynamic apis like authentication or outgoing modifying requests.

---------
Read more

* [Understanding router](/docs/guides/understanding-router.md)
* [Using logging](/docs/guides/using-logger.md)
