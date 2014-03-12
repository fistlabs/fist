'use strict';

var Next = require('../../../task/Next');

module.exports = [

    function (test) {

        var next = new Next();

        next.resolve(null, 42);

        next.next(function (res) {
            test.strictEqual(res, 42);
            test.strictEqual(this, 9000);
        }, 9000);

        next.next(function (res) {
            test.strictEqual(res, 42);
            test.strictEqual(this, 9000);
        }, 9000);

        next.next(function (res) {
            test.strictEqual(res, 42);
            test.strictEqual(this, 9000);
        }, 9000);

        next.next(function () {
            test.done();
        });
    },

    function (test) {
        var next = new Next();

        setTimeout(function () {
            next.resolve(42);
            next.resolve(null, 42);
        }, 0);

        next.next(null, function (err) {
            test.strictEqual(err, 42);
            test.strictEqual(this, 9000);
        }, 9000);

        next.next(null, function (err) {
            test.strictEqual(err, 42);
            test.strictEqual(this, 9000);
        }, 9000);

        next.next(null, function (err) {
            test.strictEqual(err, 42);
            test.strictEqual(this, 9000);
        }, 9000);

        next.next(null, function () {
            test.done();
        });
    },

    function (test) {
        var next = new Next();

        setTimeout(function () {
            next.resolve(null, 42);
        }, 0);

        next.
            next(function (res, done) {
                test.strictEqual(res, 42);
                test.strictEqual(this, 9000);
                done(null, res + 1);
                done(null, res + 10);
            }, 9000).
            next(function (res, done) {
                test.strictEqual(res, 43);
                test.strictEqual(this, 9000);
                done(null, res + 1);
            }, 9000).
            next(function (res, done) {
                test.strictEqual(res, 44);
                test.strictEqual(this, 9000);
                done(null, res + 1);
            }, 9000).
            next(function () {
                test.done();
            });
    },

    function (test) {
        var next = new Next();

        setTimeout(function () {
            next.resolve(null, 42);
        }, 0);

        next.
            next(function (res, done) {
                test.strictEqual(res, 42);
                test.strictEqual(this, 9000);
                done(res + 1);
            }, 9000).
            next(null, function (err, done) {
                test.strictEqual(err, 43);
                test.strictEqual(this, 9000);
                done(null, err + 1);
            }, 9000).
            next(function (res, done) {
                test.strictEqual(res, 44);
                test.strictEqual(this, 9000);
                done(res + 1);
            }, 9000).
            next(null, function () {
                test.done();
            });
    },

    function (test) {
        var next = new Next();

        setTimeout(function () {
            next.resolve(null, 42);
        }, 0);

        next.
            next(function (res, done) {
                test.strictEqual(res, 42);
                test.strictEqual(this, 9000);
                done(res + 1);
            }, 9000).
            next(null,function (err, done) {
                test.strictEqual(err, 43);
                test.strictEqual(this, 9000);
                done(null, err + 1);
            }, 9000).
            next(null, function (res, done) {
                test.ok(false);
                done(res + 1);
            }, 9000).
            next(function (res) {
                test.strictEqual(res, 44);
                test.done();
            });
    },

    function (test) {
        var next = new Next();

        setTimeout(function () {
            next.resolve(null, 42);
        }, 0);

        next.done(function (err, res) {
            test.strictEqual(arguments.length, 2);
            test.strictEqual(res, 42);
            test.strictEqual(this, 9000);
            test.done();
        }, 9000);
    },

    function (test) {
        var next = new Next();

        setTimeout(function () {
            next.resolve(42);
        }, 0);

        next.done(function (err, res) {
            test.strictEqual(arguments.length, 1);
            test.strictEqual(err, 42);
            test.strictEqual(this, 9000);
            test.done();
        }, 9000);
    },

    function (test) {

        var next = new Next();
        var spy = [];

        next.resolve(null, 42);

        next.done(function (err, res) {
            test.strictEqual(res, 42);
            spy.push(1);
        });

        spy.push(2);

        test.deepEqual(spy, [1,2]);

        next = new Next();
        spy = [];

        next.done(function (err, res) {
            test.strictEqual(res, 42);
            spy.push(1);
        });

        next.resolve(null, 42);
        spy.push(2);

        test.deepEqual(spy, [1,2]);

        test.done();
    }

];
