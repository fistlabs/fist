'use strict';

var Expr = /** @type Expr */ require('../../../../route/expr/Expr');
var expr = new Expr();

module.exports = {

    'Expr.prototype.escape': [
        function (test) {
            test.strictEqual(expr.escape('\\<>()'), '\\\\\\<\\>\\(\\)');
            test.done();
        }
    ],

    'Expr.prototype.unescape': [
        function (test) {
            test.strictEqual(expr.unescape('\\\\\\<\\>\\(\\)'), '\\<>()');
            test.done();
        }
    ],

    'Expr.prototype.parse': [
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
                '<param=a=>'
            ];

            errors.forEach(function (ps) {

                try {
                    expr.parse(ps);

                    throw 42;

                } catch (ex) {
                    test.ok(ex instanceof SyntaxError);
                }
            });

            sample = '\\\\\\(\\<text\\>\\)(text)text<text>text';
            expected = [
                {
                    type: Expr.PART_TYPE_DFT,
                    body: '\\(<text>)'
                },
                {
                    type: Expr.PART_TYPE_OPT,
                    body: [
                        {
                            type: Expr.PART_TYPE_DFT,
                            body: 'text'
                        }
                    ]
                },
                {
                    type: Expr.PART_TYPE_DFT,
                    body: 'text'
                },
                {
                    type: Expr.PART_TYPE_PRM,
                    body: 'text',
                    only: []
                },
                {
                    type: Expr.PART_TYPE_DFT,
                    body: 'text'
                }
            ];

            expected.map = [
                {
                    type: Expr.PART_TYPE_PRM,
                    body: 'text',
                    only: []
                }
            ];

            test.deepEqual(expr.parse(sample), expected);
            test.strictEqual(expr.parse(sample), expr.parsed[sample]);

            sample = '/(<id=a,b>/)tail/';

            expected = [
                {
                    type: Expr.PART_TYPE_DFT,
                    body: '/'
                },
                {
                    type: Expr.PART_TYPE_OPT,
                    body: [
                        {
                            type: Expr.PART_TYPE_PRM,
                            body: 'id',
                            only: [
                                {
                                    type: Expr.PART_TYPE_VAL,
                                    body: 'a'
                                },
                                {
                                    type: Expr.PART_TYPE_VAL,
                                    body: 'b'
                                }
                            ]
                        },
                        {
                            type: Expr.PART_TYPE_DFT,
                            body: '/'
                        }
                    ]
                },
                {
                    type: Expr.PART_TYPE_DFT,
                    body: 'tail/'
                }
            ];

            expected.map = [
                {
                    type: Expr.PART_TYPE_PRM,
                    body: 'id',
                    only: [
                        {
                            type: Expr.PART_TYPE_VAL,
                            body: 'a'
                        },
                        {
                            type: Expr.PART_TYPE_VAL,
                            body: 'b'
                        }
                    ]
                }
            ];

            test.deepEqual(expr.parse(sample), expected);

            expected = [
                {
                    type: Expr.PART_TYPE_PRM,
                    body: 'a',
                    only: [
                        {
                            type: Expr.PART_TYPE_VAL,
                            body: '\\b,()'
                        },
                        {
                            type: Expr.PART_TYPE_VAL,
                            body: 'c=<=>='
                        }
                    ]
                }
            ];

            expected.map = [expected[0]];

            test.deepEqual(expr.parse('<a=\\\\b\\,\\(\\),c\\=\\<\\=\\>\\=>'),
                expected);

            test.done();
        }
    ]

};
