/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/deps/context', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Context = require('../core/deps/context');

    describe('.args', function () {
        it('Should correctly dump args', function () {
            var ctx = new Context({
                args: {
                    a: 42
                }
            }, null, {
                a: 41
            });

            var args = ctx.args();

            assert.deepEqual(args, {
                a: 41
            });

            assert.strictEqual(args, ctx.args());
        });
    });

    describe('.arg', function () {
        it('Should return instance parameter', function () {

            var ctx = new Context({
                args: {
                    a: 42
                }
            }, null, {
                a: 41
            });

           assert.strictEqual(ctx.arg('a'), 41);
        });

        it('Should return request match parameter', function () {

            var ctx = new Context({
                args: {
                    a: 42
                }
            }, null, {
//                a: 41
            });

            assert.strictEqual(ctx.arg('a'), 42);
        });

        it('Should support paths', function () {

            var ctx = new Context({
                args: {
                    sort: {
                        type: 'asc'
                    }
                }
            });

            assert.strictEqual(ctx.arg('sort.type'), 'asc');
        });

        it('Should support defaultValues', function () {

            var ctx = new Context({
                args: {}
            });

            assert.strictEqual(ctx.arg('sort.type', 'asc'), 'asc');
        });
    });

    describe('.render', function () {

        it('Should render template', function (done) {

            var context = new Context({
                response: {
                    respond: function (status, body) {
                        assert.isUndefined(status);
                        assert.strictEqual(body, 'test!');
                        done();
                    }
                },
                agent: {
                    renderers: {
                        test: function (_context) {
                            assert.strictEqual(_context, context);

                            return 'test!';
                        }
                    }
                }
            });

            context.render('test');
        });
    });
});
