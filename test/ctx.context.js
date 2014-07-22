/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('fist/ctx/Deps', function () {
    /*eslint max-nested-callbacks: [2, 5]*/
    var Context = require('../ctx/context');

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
});
