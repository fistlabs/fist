/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('core/deps/context', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Context = require('../core/deps/context');

    describe('.arg', function () {
        it('Should return instance parameter', function () {

            var ctx = new Context({
                match: {
                    a: 42
                },
                url: {
                    query: {
                        a: 43
                    }
                }
            }, null, {
                a: 41
            });

           assert.strictEqual(ctx.arg('a'), 41);
        });

        it('Should return request match parameter', function () {

            var ctx = new Context({
                match: {
                    a: 42
                },
                url: {
                    query: {
                        a: 43
                    }
                }
            }, null, {
//                a: 41
            });

            assert.strictEqual(ctx.arg('a'), 42);
        });

        it('Should return request query parameter', function () {

            var ctx = new Context({
                match: {
//                    a: 42
                },
                url: {
                    query: {
                        a: 43
                    }
                }
            }, null, {
//                a: 41
            });

            assert.strictEqual(ctx.arg('a'), 43);
        });
    });

    describe('.toJSON', function () {
        it('Should serialize to JSON', function () {
            var context = new Context();
            assert.deepEqual(context.toJSON(), {
                result: {},
                errors: {}
            });
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
