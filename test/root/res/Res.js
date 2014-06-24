'use strict';

var STATUS_CODES = require('http').STATUS_CODES;
var Parted = require('../../util/Parted');
var Res = require('../../../res/Res');

var http = require('../../util/http');

module.exports = {
    Res: [
        function (test) {
            http({}, function (req, rs) {

                var res = new Res(rs, {
                    a: 5
                });

                test.deepEqual(res.params, {
                    a: 5
                });

                rs.end();
            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ],
    'Res.getStatusMessage': [
        function (test) {
            test.strictEqual(Res.getStatusMessage(200), STATUS_CODES[200]);
            test.done();
        },
        function (test) {
            test.strictEqual(Res.getStatusMessage(2), '2');
            test.done();
        }
    ],
    'Res.prototype.setHeader': [
        function (test) {
            http({}, function (req, rs) {
                var res = new Res(rs);

                res.setHeader('x-test', 'ok');
                rs.end();
            }, function (err, res) {
                test.ok(!err, res);
                test.strictEqual(res.headers['x-test'], 'ok');
                test.done();
            });
        },
        function (test) {
            http({}, function (req, rs) {
                var res = new Res(rs);

                res.setHeader('x-test', 'ok');
                res.setHeader('x-test', 'foo', true);
                rs.end();
            }, function (err, res) {
                test.ok(!err, res);
                test.strictEqual(res.headers['x-test'], 'ok');
                test.done();
            });
        },
        function (test) {
            http({}, function (req, rs) {
                var res = new Res(rs);

                res.setHeader('Set-Cookie', 'name=value');
                res.setHeader('Set-Cookie', 'name2=value2');

                rs.end();
            }, function (err, res) {
                test.ok(!err, res);
                test.deepEqual(res.headers['set-cookie'], [
                    'name=value', 'name2=value2']);
                test.done();
            });
        },
        function (test) {
            http({}, function (req, rs) {
                var res = new Res(rs);

                res.setHeaders({
                    foo: 'bar',
                    baz: 'zot'
                });
                rs.end();
            }, function (err, res) {
                test.ok(!err, res);
                test.strictEqual(res.headers.foo, 'bar');
                test.strictEqual(res.headers.baz, 'zot');
                test.done();
            });
        }
    ],
    'Res.prototype.getHeader': [
        function (test) {
            http({

            }, function (req, rs) {
                var res = new Res(rs);
                res.setHeader('test', 'ok');
                test.strictEqual(res.getHeader('Test'), 'ok');
                rs.end();
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.headers.test, 'ok');
                test.done();
            });
        }
    ],
    'Res.prototype.setStatus': [
        function (test) {
            http({

            }, function (req, rs) {
                var res = new Res(rs);
                res.setStatus(201);
                rs.end();
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        }
    ],
    'Res.prototype.getStatus': [
        function (test) {
            http({

            }, function (req, rs) {
                var res = new Res(rs);
                res.setStatus(201);
                test.strictEqual(res.getStatus(), 201);
                rs.end();
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        }
    ],
    'Res.prototype.setCookie': [
        function (test) {
            http({

            }, function (req, rs) {
                var res = new Res(rs);
                res.setCookie('name', 'value');
                rs.end();
            }, function (err, res) {
                test.ok(!err);
                test.deepEqual(res.headers['set-cookie'], ['name=value']);
                test.done();
            });
        }
    ],
    'Res.prototype.respond': [
        function (test) {
            http({

            }, function (req, res) {
                res = new Res(res);
                res.respond(201, 'test');
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'], 'text/plain');
                test.strictEqual(res.headers['content-length'], '4');
                test.deepEqual(res.data, new Buffer('test'));
                test.done();
            });
        },
        function (test) {
            http({

            }, function (req, res) {
                res = new Res(res);
                res.respond(201, new Buffer('test'));
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'],
                    'application/octet-stream');
                test.strictEqual(res.headers['content-length'], '4');
                test.deepEqual(res.data, new Buffer('test'));
                test.done();
            });
        },
        function (test) {
            http({

            }, function (req, res) {
                res = new Res(res);
                res.respond(201, new Parted('test'.split('')));
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'],
                    'application/octet-stream');
                test.strictEqual(res.headers['content-length'], '4');
                test.deepEqual(res.data, new Buffer('test'));
                test.done();
            });
        },
        function (test) {
            http({

            }, function (req, res) {
                res = new Res(res);
                res.respond(201, new Parted([new Buffer('t'), 'e', 's', 't']));
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'],
                    'application/octet-stream');
                test.strictEqual(res.headers['content-length'], '4');
                test.deepEqual(res.data, new Buffer('test'));
                test.done();
            });
        },
        function (test) {
            http({
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (req, res) {
                var parts = new Parted('test'.split(''));

                res = new Res(res);

                parts.once('data', function () {
                    this.emit('error', 'ERR');
                });

                res.respond(201, parts);
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 500);
                test.strictEqual(res.headers['content-type'], 'text/plain');
                test.strictEqual(res.headers['content-length'], '3');
                test.deepEqual(res.data, new Buffer('ERR'));
                test.done();
            });
        },
        function (test) {
            var spy = [];

            http({
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (req, res) {

                var parts = new Parted('test'.split(''));

                res = new Res(res);

                parts.pause = function () {
                    spy.push(42);
                };

                parts.once('data', function () {
                    this.emit('error', 'ERR');
                });

                res.respond(201, parts);
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 500);
                test.strictEqual(res.headers['content-type'], 'text/plain');
                test.strictEqual(res.headers['content-length'], '3');
                test.deepEqual(res.data, new Buffer('ERR'));
                test.deepEqual(spy, [42]);
                test.done();
            });
        },
        function (test) {

            var error = new Error();

            http({}, function (req, res) {
                res = new Res(res);
                res.respond(201, error);
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'], 'text/plain');
                test.strictEqual(res.headers['content-length'],
                    String(res.data.length));
                test.deepEqual(res.data, new Buffer(error.stack));
                test.done();
            });
        },
        function (test) {

            var error = new Error();

            http({}, function (req, res) {
                res = new Res(res, {
                    hideStackTrace: true
                });
                res.respond(201, error);
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'], 'text/plain');
                test.strictEqual(res.headers['content-length'],
                    String(res.data.length));
                test.deepEqual(res.data, new Buffer(STATUS_CODES[201]));
                test.done();
            });
        },
        function (test) {

            http({}, function (req, res) {
                res = new Res(res);
                res.respond(201, {a: 42});
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.strictEqual(res.headers['content-type'],
                    'application/json');
                test.strictEqual(res.headers['content-length'],
                    String(res.data.length));
                test.deepEqual(res.data, new Buffer('{"a":42}'));
                test.done();
            });
        }
    ],
    'Res.prototype.hasResponded': [
        function (test) {
            http({}, function (req, res) {
                var promise;
                res = new Res(res);
                promise = res.respond(201);
                test.ok(res.hasResponded());
                test.strictEqual(res.respond(202), promise);
            }, function (err, res) {
                test.ok(!err);
                test.strictEqual(res.statusCode, 201);
                test.done();
            });
        }
    ]
};
