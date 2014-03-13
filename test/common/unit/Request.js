'use strict';

var Fist = require('../../../Fist');
var Fs = require('fs');
var Request = require('../../../unit/Request');

var asker = require('asker');
var sock = require('../../stuff/conf/sock');

delete Object.prototype.bug;

var R0 = Request.extend({

    _options: function (ask) {
        R0.parent._options.apply(this, arguments);

        ask.next(function (opts, done) {
            opts.path = '/req/';
            opts.query = ask.track.url.query;
            opts.socketPath = sock;
            done(null, opts);
        });
    }
});

var R = R0.extend({

    _template: function (ask) {
        ask.next(function (res, done) {
            done(null, res.data);
        });
    }

});

var r = new R();

module.exports = [

    function (test) {

        var fist = new Fist();

        fist.decl('frontend', r.data.bind(r));

        fist.decl('backend', function (track, errors, result) {
            track.send(track.url.query);
        });

        fist.route('GET', '/', 'frontend');
        fist.route('GET', '/req/', 'backend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(JSON.parse(res.data), {a: '42'});
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var R1 = R.extend({
            _options: function (ask) {
                ask.done(null, {x: 42});
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(JSON.parse(res.data), {x: '42'});
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var R1 = R.extend({
            _options: function (ask) {
                setTimeout(function () {
                    ask.done(null, {x: 42});
                }, 0);
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(JSON.parse(res.data), {x: '42'});
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var R1 = R.extend({

            _options: function (ask) {
                ask.next();
                ask.next(function (res, done) {
                    setTimeout(function () {
                        ask.done(null, {x: 42});
                        done(null, 1);
                    }, 0);
                });
            },

            _request: function (ask) {
                ask.next(function (res, done) {
                    done(null, res);
                });
            }

        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(JSON.parse(res.data), {x: '42'});
            test.done();
        });
    },

    function (test) {
        var fist = new Fist();

        var R1 = R.extend({
            _options: function (ask) {
                ask.next(function (res, done) {
                    done({e: 42});
                });
                ask.next();
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.deepEqual(JSON.parse(res.data), {e: '42'});
            test.done();
        });
    },

    function (test) {
        var fist = new Fist();

        var R1 = R.extend({
            _options: function (ask) {
                ask.next(function (res, done) {
                    setTimeout(function () {
                        done({e: 42});
                    }, 0);
                });
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.deepEqual(JSON.parse(res.data), {e: '42'});
            test.done();
        });
    },

    function (test) {
        var fist = new Fist();

        var R1 = R.extend({
            _options: function (ask) {
                R1.parent._options.apply(this, arguments);

                ask.next(function (opts, done) {
                    opts.timeout = 0;
                    done(null, opts);
                });
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var R1 = R.extend({
            _request: function (ask) {
                ask.next(function (res, done) {
                    done({r: 42});
                });
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.route('GET', '/', 'frontend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(JSON.parse(res.data), {r: '42'});
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var R1 = R.extend({});

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));

        fist.decl('backend', function (track) {
            track.send('O_O');
        });

        fist.route('GET', '/', 'frontend');
        fist.route('GET', '/req/', 'backend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var r0 = new R0();

        fist.decl('frontend', r0.data.bind(r0));

        fist.decl('backend', function (track) {
            track.send(track.url.query);
        });

        fist.route('GET', '/', 'frontend');
        fist.route('GET', '/req/', 'backend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.deepEqual(JSON.parse(res.data).data, {a: '42'});
            test.strictEqual(res.statusCode, 200);
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        var R1 = R.extend({
            _template: function (ask) {
                R1.parent._template.call(this, ask);
                ask.next(function (res, done) {
                    done(res);
                });
            }
        });

        var r1 = new R1();

        fist.decl('frontend', r1.data.bind(r1));
        fist.decl('backend', function (t) {
            t.send(t.url.query);
        });

        fist.route('GET', '/', 'frontend');
        fist.route('GET', '/req/', 'backend');

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            path: '/?a=42',
            socketPath: sock,
            statusFilter: function () {

                return {
                    accept: true
                };
            }
        }, function (err, res) {
            test.strictEqual(res.statusCode, 500);
            test.deepEqual(JSON.parse(res.data), {a: '42'});
            test.done();
        });
    }

];
