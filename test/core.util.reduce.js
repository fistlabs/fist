/*global describe, it*/
'use strict';

var assert = require('chai').assert;
var vow = require('vow');

describe('core/util/reduce', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var reduce = require('../core/util/reduce');

    it('should async reduce', function (done) {
        reduce([1, 2, 3], function (result, n) {
            var defer = vow.defer();

            setTimeout(function () {
                defer.resolve(result + n);
            }, 10);

            return defer.promise();
        }, 0).done(function (res) {
            assert.strictEqual(res, 6);
            done();
        });
    });

    it('should async reduce [] (0)', function (done) {
        reduce([], function (result, n) {
            var defer = vow.defer();

            setTimeout(function () {
                defer.resolve(result + n);
            }, 10);

            return defer.promise();
        }, 0).done(function (res) {
            assert.strictEqual(res, 0);
            done();
        });
    });

    it('should async reduce [] (1)', function (done) {
        reduce([], function (result, n) {
            var defer = vow.defer();

            setTimeout(function () {
                defer.resolve(result + n);
            }, 10);

            return defer.promise();
        }).done(function (res) {
            assert.strictEqual(res, void 0);
            done();
        });
    });

    it('should get first element as initial', function (done) {
        reduce([1, 2, 3], function (result, n) {
            var defer = vow.defer();

            setTimeout(function () {
                defer.resolve(result + n);
            }, 10);

            return defer.promise();
        }).done(function (res) {
            assert.strictEqual(res, 6);
            done();
        });
    });

    it('should call in thisp context', function (done) {
        var thisp = {a: 42};

        reduce([1, 2, 3], function (result, n) {
            var defer = vow.defer();

            assert.strictEqual(this, thisp);

            setTimeout(function () {
                defer.resolve(result + n);
            }, 10);

            return defer.promise();
        }, 0, thisp).done(function (res) {
            assert.strictEqual(res, 6);
            done();
        });
    });

});
