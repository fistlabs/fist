'use strict';

var Framework = require('../../Framework');
var Fs = require('fs');
var Vow = require('vow');
var Parted = require('../util/Parted');
var Iter = require('../util/Iter');

var asker = require('asker');
var sock = require('../stuff/sock');

var Connect = require('../../track/Connect');
var STATUS_CODES = require('http').STATUS_CODES;
var http = require('../util/http');

var PublicMorozov = Framework.extend({

    callPromise: function () {
        return this._callPromise.apply(this, arguments);
    },

    callStream: function () {
        return this._callStream.apply(this, arguments);
    },

    callObj: function () {
        return this._callObj.apply(this, arguments);
    },

    callRet: function () {
        return this._callRet.apply(this, arguments);
    },

    callYield: function () {
        return this._callYield.apply(this, arguments);
    },

    callFunc: function () {
        return this._callFunc.apply(this, arguments);
    },

    callGenFn: function () {
        return this._callGenFn.apply(this, arguments);
    },

    callGen: function () {
        return this._callGen.apply(this, arguments);
    }

});

var caller = new PublicMorozov();

module.exports = {

    ready: [
        function (test) {
            var fist = new Framework();
            var spy = [];

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:ready', function () {
                spy.push(1);
            });

            fist.ready();

            test.deepEqual(spy, [0, 1]);

            test.done();
        },

        function (test) {
            var fist = new Framework();
            var spy = [];

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:ready', function () {
                spy.push(1);
                test.deepEqual(spy, [0, 1]);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    done(null, 42);
                }, 0);
            });

            fist.ready();
            fist.ready();

            setTimeout(function () {
                test.done();
            }, 100);
        },

        function (test) {
            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                setTimeout(function () {
                    done(null, null);
                }, 10);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:ready', function () {
                spy.push(1);
                test.deepEqual(spy, [0, 1]);
                test.done();
            });

            fist.ready();
        },

        function (test) {
            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                setTimeout(function () {
                    done();
                }, 10);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:ready', function () {
                spy.push(1);
                test.deepEqual(spy, [0, 1]);
                test.done();
            });

            fist.ready();
        },

        function (test) {

            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                setTimeout(function () {
                    spy.push(1);
                    done(null, null);
                }, 10);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:ready', function () {
                spy.push(3);
                test.deepEqual(spy, [0, 1, 2, 3]);
                test.done();
            });

            fist.ready();

            fist.plug(function (done) {
                setTimeout(function () {
                    spy.push(2);
                    done(null, null);
                }, 15);
            });

            fist.ready();
        },

        function (test) {

            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                done(42);
            });

            fist.plug(function (done) {
                done(43);
            });

            fist.on('sys:ready', function () {
                spy.push(100500);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:error', function (err) {
                spy.push(1);
                test.strictEqual(err, 42);
                test.deepEqual(spy, [0, 1]);
            });

            fist.ready();
            fist.ready();

            setTimeout(function () {
                test.done();
            }, 0);
        },

        function (test) {

            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                setTimeout(function () {
                    done(null, 42);
                }, 0);
            });

            fist.plug(function (done) {
                done(42);
            });

            fist.plug(function (done) {
                done(null, 42);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    done(null, 42);
                }, 0);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    done(42);
                }, 0);
            });

            fist.plug(function (done) {
                done(null, 42);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    done(42);
                }, 0);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    done(null, 42);
                }, 0);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:error', function (err) {
                spy.push(1);
                test.strictEqual(err, 42);
                test.deepEqual(spy, [0, 1]);
                //  разрешаю ошибку и делаю sys:ready

                fist.on('sys:ready', function () {
                    spy.push(100500);
                    test.deepEqual(spy, [0, 1, 100500]);
                });

                setTimeout(function () {
                    fist.emit('sys:ready');
                }, 0);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (err) {}

            fist.decl('index', 42);
            fist.route('GET', '/', 'index');
            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/'
            }, function (err, res) {
                test.deepEqual(res.data, new Buffer('42'));
                test.done();
            });
        },

        function (test) {

            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                setTimeout(function () {
                    done(42);
                }, 0);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    done(43);
                }, 50);
            });

            fist.on('sys:ready', function () {
                spy.push(100500);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.on('sys:error', function (err) {
                spy.push(1);
                test.strictEqual(err, 42);
                test.deepEqual(spy, [0, 1]);
            });

            fist.ready();

            setTimeout(function () {
                test.done();
            }, 100);
        },

        function (test) {

            var fist = new Framework();
            var spy = [];

            fist.plug(function (done) {
                setTimeout(function () {
                    spy.push(1);
                    done(null, 42);
                }, 0);
            });

            fist.plug(function (done) {
                setTimeout(function () {
                    spy.push(2);
                    done(null, 43);
                }, 50);
            });

            fist.on('sys:ready', function () {
                spy.push(100500);
                test.deepEqual(spy, [0, 1, 2, 100500]);
            });

            fist.on('sys:pending', function () {
                spy.push(0);
            });

            fist.ready();

            setTimeout(function () {
                test.done();
            }, 100);
        }
    ],

    _call: [
        function (test) {

            var fist = new Framework();

            fist.decl('index', function fn (connect, errors, result, done) {
                test.strictEqual(this.data, fn);
                done(null, 42);
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.data, new Buffer('42'));
                test.done();
            });
        },

        function (test) {

            var fist = new Framework();

            fist.decl('index', Vow.resolve(42));
            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.data, new Buffer('42'));
                test.done();
            });
        }
    ],

    _handle: [
        function (test) {

            var fist = new Framework();

            var d = new Date();

            fist.plug(function (done) {
                setTimeout(function () {
                    done(null, null);
                }, 100);
            });

            fist.decl('index', function fn (track, errors, result, done) {
                test.strictEqual(this.data, fn);
                test.strictEqual(typeof done, 'function');

                test.strictEqual(typeof done.accept, 'function');
                test.strictEqual(typeof done.reject, 'function');
                test.strictEqual(typeof done.notify, 'function');

                return {};
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.ok(d.getTime() <= Date.now());
                test.deepEqual(res.data, new Buffer('{}'));
                test.done();
            });

        },

        function (test) {

            var fist = new Framework();

            fist.decl('index', 42);
            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.plug(function (done) {
                done(42);
            });

            fist.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock,
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.strictEqual(res.statusCode, 502);
                test.done();
            });
        },

        function (test) {

            var s = new Framework();

            s.decl('a', function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                done(null, 'a');
            });

            s.decl('b', function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                track.send(201, 'b');
                test.strictEqual(track.send, Connect.noop);
            });

            s.decl('c', function (track, errors, result, done) {

                test.strictEqual('function', typeof done);
                test.strictEqual('function', typeof done.accept);
                test.strictEqual('function', typeof done.reject);
                test.strictEqual('function', typeof done.notify);

                setTimeout(function () {
                    done(null, 'c');
                }, 0);
            });

            s.decl('x', ['a', 'b', 'c'], function () {});

            http({method: 'GET'}, function (req, res) {

                var connect = new Connect(s, req, res);

                s.resolve(connect, 'x', function () {
                    test.ok(false);
                });

            }, function (err, data) {
                test.strictEqual(data.statusCode, 201);
                test.strictEqual(data.data, 'b');
                test.done();
            });

        },

        function (test) {

            var server = new Framework();

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            server.route('GET', '/<pageName>/', 'page');

            server.on('sys:match', function (track) {

                test.strictEqual(track.route, 'page');

                test.deepEqual(track.match, {
                    pageName: 'fist.io.server'
                });

            });

            server.decl('page', function (track, errors, result, done) {
                done(null, track.match.pageName);
            });

            asker({
                method: 'GET',
                path: '/fist.io.server/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.data, new Buffer('fist.io.server'));
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            server.route('GET', '/', 'index');
            server.decl('index', function (track) {
                track.send(200, 'INDEX');
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            asker({
                method: 'HEAD',
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.data, null);
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            server.route('GET', '/', 'myRoute');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            asker({
                method: 'GET',
                path: '/asd/asd/',
                socketPath: sock,
                statusFilter: function () {
                    return {
                        accept: true,
                        isRetryAllowed: false
                    };
                }
            }, function (err, res) {
                test.strictEqual(res.statusCode, 404);
                test.deepEqual(res.data,
                    new Buffer(STATUS_CODES[res.statusCode]));
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            server.route('GET', '/', 'index');
            server.route('POST', '/upload/', 'upload');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            asker({
                method: 'POST',
                path: '/',
                socketPath: sock,
                statusFilter: function () {
                    return {
                        accept: true,
                        isRetryAllowed: false
                    };
                }
            }, function (err, res) {
                test.strictEqual(res.statusCode, 405);
                test.strictEqual(res.headers.allow, 'GET');
                test.deepEqual(res.data,
                    new Buffer(STATUS_CODES[res.statusCode]));
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            asker({
                method: 'PUT',
                path: '/',
                socketPath: sock,
                statusFilter: function () {
                    return {
                        accept: true,
                        isRetryAllowed: false
                    };
                }
            }, function (err, res) {
                test.strictEqual(res.statusCode, 501);
                test.deepEqual(res.data,
                    new Buffer(STATUS_CODES[res.statusCode]));
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            server.decl('error', function (track) {
                track.send(500, new Error('O_O'));
            });

            server.route('GET', '/error/', 'error');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            asker({
                method: 'GET',
                path: '/error/',
                socketPath: sock,
                statusFilter: function () {
                    return {
                        accept: true,
                        isRetryAllowed: false
                    };
                }
            }, function (err, res) {
                test.strictEqual(res.statusCode, 500);
                test.ok(res.data + '' !== STATUS_CODES[res.statusCode]);
                test.done();
            });
        },

        function (test) {

            var server = new Framework();
            var spy = [];

            server.route('GET', '/index/', 'index');
            server.decl('index', function (track) {
                track.send('INDEX');
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            server.on('sys:response', function (event) {
                event.status(500);
                test.strictEqual(typeof event.time, 'number');
                test.ok(isFinite(event.time));
                spy.push(event.status());
            });

            asker({
                method: 'GET',
                path: '/index/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.data, new Buffer('INDEX'));
                test.deepEqual(spy, [500]);
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            server.route('GET', '/', 'index-page', {
                unit: 'index'
            });

            server.decl('index', function (track) {
                track.send('INDEX');
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.data, new Buffer('INDEX'));
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.on('sys:request', function (connect) {
                connect.send(201);
            });

            server.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock
            }, function (err, res) {
                test.deepEqual(res.statusCode, 201);
                test.done();
            });
        },

        function (test) {

            var server = new Framework();

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            server.decl('some', function (track, errors, result, done) {
                done(1);
            });

            server.route('GET', '/', 'some');

            server.listen(sock);

            asker({
                method: 'GET',
                path: '/',
                socketPath: sock,
                statusFilter: function () {
                    return {
                        accept: true
                    };
                }
            }, function (err, res) {
                test.deepEqual(res.statusCode, 500);
                test.deepEqual(res.data + '', '1');
                test.done();
            });
        }
    ],

    callPromise: [
        function (test) {
            caller.callPromise(Vow.resolve(42), function (err, res) {
                test.strictEqual(this, caller);
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
                test.strictEqual(this, caller);
                test.strictEqual(err, 42);
                test.ok(!res);
                test.done();
            });
        }
    ],
    callStream: [
        function (test) {
            caller.callStream(new Parted(['a', 'b', 'c']),
                function (err, res) {
                    test.strictEqual(this, caller);
                    test.deepEqual(res, new Buffer('abc'));
                    test.done();
                });
        }
    ],
    callObj: [
        function (test) {
            caller.callObj({}, 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, {});
                test.done();
            });
        },
        function (test) {
            caller.callObj({a: {}}, 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, {a: {}});
                test.done();
            });
        },
        function (test) {
            caller.callObj([], 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, []);
                test.done();
            });
        },
        function (test) {
            caller.callObj([1], 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, [1]);
                test.done();
            });
        },
        function (test) {
            caller.callObj([1, Vow.resolve(42)], 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, [1, 42]);
                test.done();
            });
        },
        function (test) {
            caller.callObj([Vow.reject(42), Vow.reject(43)], 42,
                function (err) {
                    test.strictEqual(this, caller);
                    test.deepEqual(err, 42);
                    test.done();
                });
        }
    ],
    callRet: [
        function (test) {
            caller.callRet(42, 52, function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet(function (done) {
                test.strictEqual(this, 42);
                done(null, 42);
            }, 42, function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet(new Iter([42]), 42, function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet(new Parted([42]), 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, new Buffer('42'));
                test.done();
            });
        },
        function (test) {
            caller.callRet(Vow.resolve(42), 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callRet({
                get then() {
                    throw 42;
                }
            }, 42, function (err) {
                test.strictEqual(this, caller);
                test.deepEqual(err, 42);
                test.done();
            });
        },
        function (test) {
            test.ok(!caller.callRet({}));
            test.done();
        }
    ],
    callYield: [
        function (test) {
            caller.callYield(42, 42, function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callYield({}, 42, function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, {});
                test.done();
            });
        }
    ],
    callFunc: [
        function (test) {
            caller.callFunc(function (done) {
                test.strictEqual(this, 42);
                done.call(this, null, 42);
            }, 42, [], function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callFunc(function () {
                test.strictEqual(this, 42);
                return {a: 42};
            }, 42, [], function (err, res) {
                test.strictEqual(this, caller);
                test.deepEqual(res, {a: 42});
                test.done();
            });
        },
        function (test) {
            caller.callFunc(function (done) {
                test.strictEqual(this, 42);
                done(null, 42);
                done(null, 43);
            }, 42, [], function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                setTimeout(function () {
                    test.done();
                }, 0);
            });
        },
        function (test) {
            caller.callFunc(function () {
                test.strictEqual(this, 42);

                return 42;
            }, 42, [], function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        },
        function (test) {
            caller.callFunc({
                constructor: {
                    name: 'GeneratorFunction'
                },
                apply: function (self) {
                    test.strictEqual(self, 42);

                    return new Iter([42]);
                }
            }, 42, [], function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ],
    callGenFn: [
        function (test) {
            caller.callGenFn(function () {
                test.strictEqual(this, 42);
                return new Iter([42]);
            }, 42, [], function (err, res) {
                test.strictEqual(this, caller);
                test.strictEqual(res, 42);
                test.done();
            });
        }
    ],
    callGen: [
        function (test) {
            caller.callGen(new Iter([1, 42]), 42, null, false,
                function (err, res) {
                    test.strictEqual(this, caller);
                    test.strictEqual(res, 42);
                    test.done();
                });
        },
        function (test) {
            caller.callGen(new Iter([43]), 42, 42, true, function (err) {
                test.strictEqual(this, caller);
                test.strictEqual(err, 42);
                test.done();
            });
        },
        function (test) {
            caller.callGen(new Iter([Vow.reject(42), 43]), 42, null,
                false, function (err) {
                    test.strictEqual(this, caller);
                    test.strictEqual(err, 42);
                    test.done();
                });
        }
    ]
};
