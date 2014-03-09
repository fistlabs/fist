'use strict';

var Task = require('../../../task/Task');

module.exports = {

    'Task.prototype.done': function (test) {

        var i;
        var l;
        var spy = [];

        function deferred (a, b, c, done) {
            test.strictEqual(this, 9000);
            setTimeout(function () {
                done(null, a + b + c);
                done(null, 42);
            }, 50);
        }

        function done (err, res) {
            test.strictEqual(err, null);
            test.strictEqual(res, 6);
            test.strictEqual(this, 42);
            spy.push(0);
        }

        var task = new Task(deferred, 9000, [1, 2, 3]);

        for (i = 0, l = 10; i < l; i += 1) {
            task.done(done, 42);
        }

        setTimeout(function () {
            test.deepEqual(task.clbs, []);

            for (i = 0, l = 10; i < l; i += 1) {
                task.done(done, 42);
            }

            task.done(function () {
                test.strictEqual(spy.length, 20);
                test.done();
            });
        }, 100);
    },

    'Task.queue0': function (test) {

        var tasks = [
            new Task(function (a, b, done) {
                test.strictEqual(this, 42);
                test.strictEqual(a, 1);
                test.strictEqual(b, 2);
                done(null, 43);
            }, 42, [1,2]),
            new Task(function (a, b, done) {
                test.strictEqual(this, 44);
                test.strictEqual(a, 3);
                test.strictEqual(b, 4);
                done(null, 45);
            }, 44, [3, 4])
        ];

        Task.queue(tasks, function (err, res) {
            test.strictEqual(arguments.length, 2);
            test.strictEqual(this, 100500);
            test.deepEqual(res, [43, 45]);
            test.done();
        }, 100500);
    },

    'Task.queue1': function (test) {

        var tasks = [
            new Task(function (a, b, done) {
                test.strictEqual(this, 42);
                test.strictEqual(a, 1);
                test.strictEqual(b, 2);
                done(43);
            }, 42, [1, 2]),
            new Task(function (a, b, done) {
                test.strictEqual(this, 44);
                test.strictEqual(a, 3);
                test.strictEqual(b, 4);
                done(null, 45);
            }, 44, [3, 4])
        ];

        Task.queue(tasks, function (err, res) {
            test.strictEqual(arguments.length, 1);
            test.strictEqual(this, 100500);
            test.deepEqual(err, 43);
            test.done();
        }, 100500);
    }
};
