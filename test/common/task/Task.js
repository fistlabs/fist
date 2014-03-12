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

            for (i = 0, l = 10; i < l; i += 1) {
                task.done(done, 42);
            }

            task.done(function () {
                test.strictEqual(spy.length, 20);
                test.done();
            });
        }, 100);
    }

};
