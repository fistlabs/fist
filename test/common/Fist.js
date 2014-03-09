'use strict';

var sock = require('../stuff/conf/sock');
var Fist = require('../../Fist');
var Fs = require('fs');
var Path = require('path');
var asker = require('asker');
var routes = require('../stuff/conf/router0');
var Promise = require('fist.util.promise');

var STATUS_CODES = require('http').STATUS_CODES;

module.exports = {

    Fist0: function (test) {

        var fist = new Fist({
            action: [
                Path.resolve('test/stuff/action/data0/*.js'),
                Path.resolve('test/stuff/action/data1/*.js')
            ],
            routes: routes
        });

        var spy = {
            rj: [],
            ac: [],
            rq: [],
            rs: [],
            mt: []
        };

        fist.on('accept', function (data) {
            spy.ac.push(data.path);
        });

        fist.on('reject', function (data) {
            spy.rj.push(data.path);
        });

        fist.on('request', function (data) {
            spy.rq.push(data.url.pathname);
        });

        fist.on('response', function (data) {
            spy.rs.push(data.url.pathname);
        });

        fist.on('match-done', function (data) {
            spy.mt.push(data.url.pathname);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            timeout: 10000,
            socketPath: sock,
            path: '/'
        }, function (err, data) {

            test.strictEqual(data.data + '', JSON.stringify({
                result: {
                    className: 'by-stuff',
                    data: 100500,
                    knot: {
                        action: [
                            Path.resolve('test/stuff/action/data0/*.js'),
                            Path.resolve('test/stuff/action/data1/*.js')
                        ],
                        routes: routes
                    }
                },
                errors: {
                    error: 'error'
                }
            }));

            test.deepEqual(spy, {
                rq: ['/'],
                ac: ['abbr', 'className', 'data', 'knot'],
                rj: ['error'],
                rs: ['/'],
                mt: ['/']
            });

            test.done();
        });
    },

    Fist1: function (test) {

        var fist = new Fist({
            action: [
                Path.resolve('test/stuff/action/data0/*.js'),
                null
            ],
            routes: routes
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/',
            socketPath: sock
        }, function (err) {
            test.ok(err);
            test.done();
        });
    },

    Fist2: function (test) {

        var fist = new Fist({
            action: [],
            routes: routes
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '',
                require('http').STATUS_CODES[res.statusCode]);
            test.done();
        });
    },

    Fist3: function (test) {

        var fist = new Fist();

        fist.decl('john', Promise.resolve('john'));

        fist.decl('users', ['john'], function (track, result, errors, done) {

            setTimeout(function () {
                done(null, [result.john]);
            }, 0);

            return ['mike'];
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.data + '', '["mike"]');
            test.done();
        });
    },

    Fist4: function (test) {

        var fist = new Fist();

        fist.decl('users', function (t, e, r, done) {

            var promise;

            setTimeout(function () {
                done(null, ['O_o']);
            }, 0);

            promise = new Promise();

            setTimeout(function () {
                promise.fulfill(['mike']);
            }, 100);

            return promise;
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.data + '', '["mike"]');
            test.done();
        });
    },

    Fist5: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return {
                then: function () {
                    throw 0;
                }
            };
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '0');
            test.done();
        });
    },

    Fist6: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return {
                then: function (onResolved, onRejected) {
                    onRejected(0);
                    onRejected(5);
                }
            };
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '0');
            test.done();
        });
    },

    Fist7: function (test) {

        var fist = new Fist();

        fist.decl('users', function () {

            return function (done) {
                done(42);
                done(43);
            };
        });

        fist.route('GET', '/', 'users');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '42');
            test.done();
        });
    },

    Fist8: function (test) {

        var fist = new Fist();

        fist.decl('stream', function (track) {
            //  так в реальной жизни делать нельзя
            return track._req;
        });

        fist.route('POST', '/', 'stream');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'post',
            path: '/',
            body: ':)',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 200);
            test.strictEqual(res.data + '', ':)');
            test.done();
        });
    },

    Fist9: function (test) {

        var fist = new Fist();

        fist.decl('promise', function () {

            var x = {};

            Object.defineProperty(x, 'then', {
                get: function () {

                    throw 1;
                }
            });

            return x;
        });

        fist.route('GET', '/', 'promise');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.strictEqual(res.data + '', '1');
            test.done();
        });
    },

    Fist10: function (test) {

        var fist = new Fist();

        fist.decl('primitive', function () {

            return 5;
        });

        fist.route('GET', '/', 'primitive');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 200);
            test.strictEqual(res.data + '', '5');
            test.done();
        });
    },

    Fist11: function (test) {

        var fist = new Fist({
            routes: routes
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock
        }, function (err) {
            test.ok(err);
            test.done();
        });
    },

    Fist12: function (test) {

        var fist = new Fist({
            routes: routes
        });

        fist.decl('index', function (t, e, r, done) {
            done(null, 55);

            return 56;
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.strictEqual(res.data + '', '55');
            test.done();
        });
    },

    Fist13: function (test) {

        var fist = new Fist({
            routes: routes
        });

        fist.decl('index', function (t, e, r, done) {
            setTimeout(function () {
                done(null, 55);
            }, 0);
            return 56;
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.strictEqual(res.data + '', '56');
            test.done();
        });
    },

    Fist14: function (test) {

        var fist = new Fist({
            routes: routes
        });

        fist.decl('index', function (t, e, r, done) {
            done(null, new Error());
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'get',
            path: '/',
            socketPath: sock
        }, function (err, res) {
            test.strictEqual(res.data + '', '{}');
            test.done();
        });
    },

    Fist15: function (test) {

        var fist = new Fist({
            routes: routes
        });

        fist.decl('static', function (t, e, r, done) {
            test.strictEqual(t.url.path, '/static/js/index.js');
            done(null, t.url.path);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/static/js/index.js',
            socketPath: sock,
            statusFilter: function () {
                return {
                    accept: true,
                    isRetryAllowed: false
                };
            }
        }, function (err, res) {
            test.strictEqual(res.data + '', '/static/js/index.js');
            test.done();
        });

    },

    'Server-0': function (test) {

        var server = new Fist({
            staging: true
        });

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.decl('err', function (track, errors, result, done) {
            done(new Error());
        });

        server.route('GET', '/error/', 'err');

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
            test.strictEqual(res.data + '', STATUS_CODES[res.statusCode]);
            test.done();
        });
    },

    'Server-1': function (test) {

        var server = new Fist({
            staging: false
        });

        var er = new Error();

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        server.decl('err', function (track, errors, result, done) {
            done(er);
        });

        server.route('GET', '/error/', 'err');

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
            test.strictEqual(res.data + '', er.stack);
            test.done();
        });
    }

};
