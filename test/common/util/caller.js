'use strict';

var caller = require('../../../util/caller');
var Vow = require('vow');
var Parted = require('../../util/Parted');
var Iter = require('../../util/Iter');

module.exports = {
    callPromise: [
        function (test) {
            caller.callPromise(Vow.resolve(42), function (err, res) {
                test.strictEqual(res, 42);
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            caller.callPromise({
                get then() {
                    throw 42
                }
            }, function (err, res) {
                test.strictEqual(err, 42);
                test.ok(!res);
                test.done();
            });
        }
    ],
    callStream: [
        function (test) {
            caller.callStream(new Parted(['a', 'b', 'c']), function (err, res) {
                test.deepEqual(res, new Buffer('abc'));
                test.done();
            });
        }
    ],
    callObj: [
        function (test) {
            caller.callObj({}, function (err, res) {
                test.deepEqual(res, {});
                test.done();
            });
        },
        function (test) {
            caller.callObj([], function (err, res) {
                test.deepEqual(res, []);
                test.done();
            });
        },
        function (test) {
            caller.callObj([1], function (err, res) {
                test.deepEqual(res, [1]);
                test.done();
            });
        },
        function (test) {
            caller.callObj([1, Vow.resolve(42)], function (err, res) {
                test.deepEqual(res, [1, 42]);
                test.done();
            });
        },
        function (test) {
            caller.callObj([Vow.reject(42), Vow.reject(43)], function (err) {
                test.deepEqual(err, 42);
                test.done();
            });
        }
    ],
    callRet: [
        function (test) {
            caller.callRet(42, function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet(function (done) {
                done(null, 42);
            }, function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet(new Iter([42]), function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet(new Parted([42]), function (err, res) {
                test.deepEqual(res, new Buffer('42'));
                test.done();
            });
        },
        function (test) {
            caller.callRet(Vow.resolve(42), function (err, res) {
                test.deepEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet({
                get then() {
                    throw 42;
                }
            }, function (err) {
                test.deepEqual(err, 42);
                test.done();
            });
        },
        function (test) {
            test.ok( !caller.callRet({}));
            test.done();
        }
    ],
    callYield: [
        function (test) {
            caller.callYield(42, function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callYield({}, function (err, res) {
                test.deepEqual(res, {});
                test.done();
            });
        }
    ],
    callFunc: [
        function (test) {
            caller.callFunc(function (done) {
                done(null, 42);
            }, [], function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callFunc(function (done) {
                done(null, 42);
                done(null, 43);
            }, [], function (err, res) {
                test.strictEqual(res, 42);
                setTimeout(function () {
                    test.done();
                }, 0);
            });
        },
        function (test) {
            caller.callFunc(function () {
                return 42;
            }, [], function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callFunc({
                constructor: {
                    name: 'GeneratorFunction'
                },
                apply: function () {
                    return new Iter([42]);
                }
            }, [], function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ],
    callGenFn: [
        function (test) {
            caller.callGenFn(function () {
                return new Iter([42]);
            }, [], function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ],
    callGen: [
        function (test) {
            caller.callGen(new Iter([1, 42]), null, false, function (err, res) {
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callGen(new Iter([43]), 42, true, function (err) {
                test.strictEqual(err, 42);
                test.done();
            });
        },
        function (test) {
            caller.callGen(new Iter([Vow.reject(42), 43]), null, false,
                function (err) {
                    test.strictEqual(err, 42);
                    test.done();
                });
        }
    ]
};
