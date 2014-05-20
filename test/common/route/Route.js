'use strict';

var Route = require('../../../route/Route');

module.exports = {

    Route: [
        function (test) {

            var route = new Route('/pa[a-z]ge/(<name>/)');

            test.strictEqual(route.regex.source,
                '^\\/pa\\[a\\-z\\]ge\\/(?:([^/]+)\\/)?$');
            test.deepEqual(route.ast.map, [
                {
                    type: Route.PART_TYPE_PRM,
                    body: 'name',
                    only: []
                }
            ]);

            test.done();
        }
    ],

    'Route.escape': [
        function (test) {
            test.strictEqual(Route.escape('\\<>()'), '\\\\\\<\\>\\(\\)');
            test.done();
        }
    ],

    'Route.parse': [
        function (test) {

            var errors;
            var sample;
            var expected;

            errors = [
                '<(',
                '<a(',
                ')',
                '()',
                '<<',
                '<a<',
                '>',
                '<>',
                '(',
                '<',
                '\\',
                '',
                ',',
                '<param=>',
                '<param=,>',
                '<param=a,>',
                '=',
                '(=)',
                '<param=a=>',
                '<param=*a>',
                '*'
            ];

            errors.forEach(function (ps) {

                try {
                    Route.parse(ps);

                    throw 42;

                } catch (ex) {
                    test.ok(ex instanceof SyntaxError);
                }
            });

            sample = '\\\\\\(\\<text\\>\\)(text)text<text>text';
            expected = [
                {
                    type: Route.PART_TYPE_DFT,
                    body: '\\(<text>)'
                },
                {
                    type: Route.PART_TYPE_OPT,
                    body: [
                        {
                            type: Route.PART_TYPE_DFT,
                            body: 'text'
                        }
                    ]
                },
                {
                    type: Route.PART_TYPE_DFT,
                    body: 'text'
                },
                {
                    type: Route.PART_TYPE_PRM,
                    body: 'text',
                    only: []
                },
                {
                    type: Route.PART_TYPE_DFT,
                    body: 'text'
                }
            ];

            expected.map = [
                {
                    type: Route.PART_TYPE_PRM,
                    body: 'text',
                    only: []
                }
            ];

            test.deepEqual(Route.parse(sample), expected);

            sample = '/(<id=a,b>/)tail/';

            expected = [
                {
                    type: Route.PART_TYPE_DFT,
                    body: '/'
                },
                {
                    type: Route.PART_TYPE_OPT,
                    body: [
                        {
                            type: Route.PART_TYPE_PRM,
                            body: 'id',
                            only: [
                                {
                                    type: Route.PART_TYPE_VAL,
                                    body: 'a'
                                },
                                {
                                    type: Route.PART_TYPE_VAL,
                                    body: 'b'
                                }
                            ]
                        },
                        {
                            type: Route.PART_TYPE_DFT,
                            body: '/'
                        }
                    ]
                },
                {
                    type: Route.PART_TYPE_DFT,
                    body: 'tail/'
                }
            ];

            expected.map = [
                {
                    type: Route.PART_TYPE_PRM,
                    body: 'id',
                    only: [
                        {
                            type: Route.PART_TYPE_VAL,
                            body: 'a'
                        },
                        {
                            type: Route.PART_TYPE_VAL,
                            body: 'b'
                        }
                    ]
                }
            ];

            test.deepEqual(Route.parse(sample), expected);

            expected = [
                {
                    type: Route.PART_TYPE_PRM,
                    body: 'a',
                    only: [
                        {
                            type: Route.PART_TYPE_VAL,
                            body: '\\b,()'
                        },
                        {
                            type: Route.PART_TYPE_VAL,
                            body: 'c=<=>='
                        }
                    ]
                }
            ];

            expected.map = [expected[0]];

            test.deepEqual(Route.parse('<a=\\\\b\\,\\(\\),c\\=\\<\\=\\>\\=>'),
                expected);

            test.done();
        }
    ],

    'Route.prototype.match': [
        function (test) {

            var route = new Route('/p(age)/(<name>/)');

            test.deepEqual(route.match('/page/index/'), {
                name: 'index'
            });

            test.strictEqual(route.match('/page/index/asd/'), null);
            test.strictEqual(route.match('/PAGE/index/'), null);

            test.strictEqual(route.match('/page/index/'),
                route.matches['/page/index/']);

            test.deepEqual(route.match('/p/index/'), {
                name: 'index'
            });

            test.deepEqual(route.match('/p/'), {
                name: void 0
            });

            route = new Route('/page/<name>/<name>/<name>-!/');

            test.deepEqual(route.
                match('/page/golyshev/dmitrii/sergeievich-!/'), {
                name: ['golyshev', 'dmitrii', 'sergeievich']
            });

            route = new Route('/page/<name=1,2>/', {
                nocase: true
            });

            test.deepEqual(route.match('/PAGE/1/'), {
                name: '1'
            });

            test.strictEqual(route.match('/page/3/'), null);

            route = new Route('/page/(<id=a,b>/)');

            test.strictEqual(route.match('/page/c/'), null);

            route = new Route('/<folder><path=*,a>');

            test.deepEqual(route.match('/images/path/to/image.gif'), {
                folder: 'images',
                path: '/path/to/image.gif'
            });

            route = new Route('/a/<a=\\*>');

            test.deepEqual(route.match('/a/*'), {
                a: '*'
            });

            test.strictEqual(route.match('/a/x'), null);

            test.done();
        }
    ],

    'Route.prototype.build': [
        function (test) {

            var route = new Route('/p(age)/(<name>/)');

            test.strictEqual(route.build({
                name: 123
            }), '/page/123/');

            test.strictEqual(route.build(), '/page/');

            route = new Route('/p(age)/(for/<name>/)');

            test.strictEqual(route.build(), '/page/');
            test.strictEqual(route.build({name: ['xxx']}), '/page/for/xxx/');

            route = new Route('/page/<name>/<name>/(<name>/)');

            test.strictEqual(route.build({
                name: [1, 2]
            }), '/page/1/2/');

            test.strictEqual(route.build({
                name: [1, 2, 3]
            }), '/page/1/2/3/');

            test.strictEqual(route.build({
                /*eslint no-sparse-arrays: 0*/
                name: [, 1, 2]
            }), '/page//1/2/');

            route = new Route('/(<p1>-(<p2>)-x)');

            test.strictEqual(route.build({
                p1: 1
            }), '/1--x');

            route = new Route('/(<id>/)page/');

            test.strictEqual(route.build({
                id: void 0
            }), '/page/');

            route = new Route('/page/<id=1,2>/');

            test.strictEqual(route.build({
                id: 1
            }), '/page/1/');

            test.strictEqual(route.build({
                id: 3
            }), '/page//');

            route = new Route('/page/<id=x>/(<id=1,2>/)tail/');

            test.strictEqual(route.build({
                id: ['x', 1]
            }), '/page/x/1/tail/');

            test.strictEqual(route.build({
                id: ['x', 3]
            }), '/page/x/tail/');

            test.strictEqual(route.build({
                id: ['z', 3]
            }), '/page//tail/');

            route = new Route('/<folder><path=*,a>');

            test.strictEqual(route.build({
                folder: 'css',
                path: '/index/_index.css'
            }), '/css/index/_index.css');

            route = new Route('/<a=*><a=*>');

            test.strictEqual(route.build({
                a: ['css', '/index/_index.css']
            }), '/css/index/_index.css');

            test.done();
        },
        function (test) {
            var route = new Route('/a/(<page>/c/)');

            test.strictEqual(route.build({
                page: 5,
                text: 42
            }), '/a/5/c/?text=42');

            test.strictEqual(route.build(), '/a/');

            route = new Route('/(<competitionId>/)contest/' +
                '<contestId>/<contestPage>/');

            test.strictEqual(route.build({
                competitionId: void 0,
                contestId: '59',
                contestPage: 'enter'
            }), '/contest/59/enter/');

            test.done();
        }
    ]

};
