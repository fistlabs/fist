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

            test.deepEqual(router.find({
                method: 'HEAD',
                url: {
                    pathname: '/index/'
                }
            }), []);

            var GET = router.addRoute('GET', '/index/', 4);

            test.deepEqual(router.find({
                method: 'GET',
                url: {
                    pathname: '/index/'
                }
            }), {
                match: {},
                route: GET
            });

            test.deepEqual(router.find({
                method: 'HEAD',
                url: {
                    pathname: '/index/'
                }
            }), {
                match: {},
                route: GET
            });

            test.deepEqual(router.find({
                method: 'PUT',
                url: {
                    pathname: '/index/'
                }
            }), []);

            test.deepEqual(router.find({
                method: 'POST',
                url: {
                    pathname: '/index/'
                }
            }), ['GET']);
            test.strictEqual(router.find({
                method: 'GET',
                url: {
                    pathname: '/'
                }
            }), null);

            test.deepEqual(router.find({
                method: 'HEAD',
                url: {
                    pathname: '/index/'
                }
            }), {
                match: {},
                route: GET
            });

            test.deepEqual(router.find({
                method: 'HEAD',
                url: {
                    pathname: '/index/post/'
                }
            }), ['POST']);

            test.done();
        },
        function (test) {

            var router = new Router();

            var r1 = router.addRoute('GET', '/<page1>/', 'page1');
            var r2 = router.addRoute('GET', '/<page2>/', 'page2');

            test.deepEqual(router.find({
                url: {
                    pathname: '/index/'
                },
                method: 'GET'
            }), {
                match: {
                    page1: 'index'
                },
                route: r1
            });

            test.deepEqual(router.find({
                url: {
                    pathname: '/index/'
                },
                method: 'GET',
                route: 'page1'
            }), {
                match: {
                    page2: 'index'
                },
                route: r2
            });

            test.strictEqual(router.find({
                url: {
                    pathname: '/index/'
                },
                method: 'GET',
                route: 'page2'
            }), null);

            test.strictEqual(router.find({
                url: {
                    pathname: '/index/'
                },
                method: 'GET',
                route: 'page0'
            }), null);

            test.done();
        }
    ]
};
