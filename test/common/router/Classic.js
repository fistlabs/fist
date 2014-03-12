'use strict';

var Classic = require('../../../router/Classic');

module.exports = {

    addRoute: function (test) {

        var router = new Classic();
        var route;

        router.addRoute('GET', '/', 'name');
        router.addRoute('PUT', '/', 'name2');

        route = router.addRoute('POST', 'upload', 'name');

        test.deepEqual(router.verbs, {
            GET: 0,
            PUT: 1,
            POST: 1
        });

        test.strictEqual(router.routes.length, 2);
        test.strictEqual(router.routes[1], route);

        test.done();
    },

    getRoute: function (test) {

        var router = new Classic();

        [
            {
                name: 'index',
                expr: '/',
                verb: 'get'
            },
            {
                name: 'index2',
                expr: '/path/',
                verb: 'get'
            },
            {
                name: 'index3',
                expr: '/',
                verb: 'get'
            },
            {
                name: 'index4',
                expr: '/path/',
                verb: 'get'
            }
        ].forEach(function (desc) {
                router.addRoute(desc.verb, desc.expr, desc.name);
            });

        test.strictEqual(router.getRoute('index2'), router.routes[1]);
        test.strictEqual(router.getRoute('sdasd'), null);
        test.done();
    },

    find: function (test) {

        var router = new Classic();

        router.addRoute('post', '/index/post/', 1);

        router.addRoute('POST', '/(index/)post/', 2);
        router.addRoute('POST', '/index/upload/', 3);

        test.deepEqual(router.find('head', '/index/'), []);

        var GET = router.addRoute('GET', '/index/', 4);

        test.deepEqual(router.find('GET', '/index/'), {
            match: {},
            route: GET
        });

        test.deepEqual(router.find('head', '/index/'), {
            match: {},
            route: GET
        });

        test.deepEqual(router.find('put', '/index/'), []);

        test.deepEqual(router.find('POST', '/index/'), ['GET']);
        test.strictEqual(router.find('GET', '/'), null);

        test.deepEqual(router.find('HEAD', '/index/'), {
            match: {},
            route: GET
        });

        test.deepEqual(router.find('HEAD', '/index/post/'), ['POST']);

        test.done();
    }
};
