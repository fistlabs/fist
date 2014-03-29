'use strict';

var caller = require('../../../util/caller');
var Vow = require('vow');
var Parted = require('../../util/Parted');
var Iter = require('../../util/Iter');

var ctx = {};

module.exports = {
    callPromise: [
        function (test) {
            caller.callPromise.call(ctx, Vow.resolve(42), function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            caller.callPromise.call(ctx, {
                get then() {
                    throw 42
                }
            }, function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(err, 42);
                test.ok(!res);
                test.done();
            });
        }
    ],
    callStream: [
        function (test) {
            caller.callStream.call(ctx, new Parted(['a', 'b', 'c']),
                function (err, res) {
                    test.strictEqual(this, ctx);
                    test.deepEqual(res, new Buffer('abc'));
                    test.done();
                });
        }
    ],
    callObj: [
        function (test) {
            caller.callObj.call(ctx, {}, function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, {});
                test.done();
            });
        },
        function (test) {
            caller.callObj.call(ctx, {a: {}}, function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, {a: {}});
                test.done();
            });
        },
        function (test) {
            caller.callObj.call(ctx, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, []);
                test.done();
            });
        },
        function (test) {
            caller.callObj.call(ctx, [1], function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, [1]);
                test.done();
            });
        },
        function (test) {
            caller.callObj.call(ctx, [1, Vow.resolve(42)], function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, [1, 42]);
                test.done();
            });
        },
        function (test) {
            caller.callObj.call(ctx, [Vow.reject(42), Vow.reject(43)],
                function (err) {
                    test.strictEqual(this, ctx);
                    test.deepEqual(err, 42);
                    test.done();
                });
        }
    ],
    callRet: [
        function (test) {
            caller.callRet.call(ctx, 42, function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet.call(ctx, function (done) {
                test.strictEqual(this, ctx);
                done.call(this, null, 42);
            }, function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet.call(ctx, new Iter([42]), function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet.call(ctx, new Parted([42]), function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, new Buffer('42'));
                test.done();
            });
        },
        function (test) {
            caller.callRet.call(ctx, Vow.resolve(42), function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet.call(ctx, {
                get then() {
                    throw 42;
                }
            }, function (err) {
                test.strictEqual(this, ctx);
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
            caller.callYield.call(ctx, 42, function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callYield.call(ctx, {}, function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, {});
                test.done();
            });
        }
    ],
    callFunc: [
        function (test) {
            caller.callFunc.call(ctx, function (done) {
                test.strictEqual(this, ctx);
                done.call(this, null, 42);
            }, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callFunc.call(ctx, function () {
                test.strictEqual(this, ctx);
                return {a: 42};
            }, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.deepEqual(res, {a: 42});
                test.done();
            });
        },
        function (test) {
            caller.callFunc.call(ctx, function (done) {
                test.strictEqual(this, ctx);
                done.call(this, null, 42);
                done.call(this, null, 43);
            }, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                setTimeout(function () {
                    test.done();
                }, 0);
            });
        },
        function (test) {
            caller.callFunc.call(ctx, function () {
                test.strictEqual(this, ctx);

                return 42;
            }, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callFunc.call(ctx, {
                constructor: {
                    name: 'GeneratorFunction'
                },
                apply: function (self) {
                    test.strictEqual(self, ctx);

                    return new Iter([42]);
                }
            }, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ],
    callGenFn: [
        function (test) {
            caller.callGenFn.call(ctx, function () {
                test.strictEqual(this, ctx);
                return new Iter([42]);
            }, [], function (err, res) {
                test.strictEqual(this, ctx);
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ],
    callGen: [
        function (test) {
            caller.callGen.call(ctx, new Iter([1, 42]), null, false,
                function (err, res) {
                    test.strictEqual(this, ctx);
                    test.strictEqual(res, 42);
                    test.done();
                });
        },
        function (test) {
            caller.callGen.call(ctx, new Iter([43]), 42, true, function (err) {
                test.strictEqual(this, ctx);
                test.strictEqual(err, 42);
                test.done();
            });
        },
        function (test) {
            caller.callGen.call(ctx, new Iter([Vow.reject(42), 43]), null,
                false, function (err) {
                    test.strictEqual(this, ctx);
                    test.strictEqual(err, 42);
                    test.done();
                });
        }
    ]
};
