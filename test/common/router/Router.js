'use strict';

var Router = require('../../../router/Router');

module.exports = {

    'Router.prototype.addRoute': [
        function (test) {

            var router = new Router();
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
        }
    ],

    'Router.prototype.getRoute': [
        function (test) {

            var router = new Router();

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
        }
    ],

    'Router.prototype.find': [
        function (test) {

            var router = new Router();

            router.addRoute('POST', '/index/post/', 1);

            router.addRoute('POST', '/(index/)post/', 2);
            router.addRoute('POST', '/index/upload/', 3);

            test.deepEqual(router.find('HEAD', '/index/'), []);

            var GET = router.addRoute('GET', '/index/', 4);

            test.deepEqual(router.find('GET', '/index/'), {
                match: {},
                route: GET
            });

            test.deepEqual(router.find('HEAD', '/index/'), {
                match: {},
                route: GET
            });

            test.deepEqual(router.find('PUT', '/index/'), []);

            test.deepEqual(router.find('POST', '/index/'), ['GET']);

            test.strictEqual(router.find('GET', '/'), null);

            test.deepEqual(router.find('HEAD', '/index/'), {
                match: {},
                route: GET
            });

            test.deepEqual(router.find('HEAD', '/index/post/'), ['POST']);

            test.done();
        },
        function (test) {

            var router = new Router();

            var r1 = router.addRoute('GET', '/<page1>/', 'page1');
            var r2 = router.addRoute('GET', '/<page2>/', 'page2');

            test.deepEqual(router.find('GET', '/index/'), {
                match: {
                    page1: 'index'
                },
                route: r1
            });

            test.deepEqual(router.find('GET', '/index/', 'page1'), {
                match: {
                    page2: 'index'
                },
                route: r2
            });

            test.strictEqual(router.find('GET', '/index/', 'page2'), null);
            test.strictEqual(router.find('GET', '/index/', 'page0'), null);

            test.done();
        }
    ]
};
