'use strict';

var Fist = require('../../../Framework');
var asker = require('asker');

var Fs = require('fs');
var sock = require('../../stuff/conf/sock');

module.exports = {

    'Runtime.prototype.arg': [
        function (test) {

            var fist = new Fist();

            fist.route('GET', '/<page=about>/(<sub>)', 'index');

            fist.decl('index', function (track) {
                test.strictEqual(track.arg('page', true), 'about');
                test.strictEqual(track.arg('sub'), '80');
                track.send(200);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/about/?page=index&sub=80'
            }, function (err, data) {
                test.ok(data);
                test.strictEqual(data.statusCode, 200);
                test.done();
            });
        }
    ],

    'Runtime.prototype.buildPath': [
        function (test) {

            var fist = new Fist();

            fist.route('GET', '/(<pageName>/)', 'url');

            fist.decl('url', function (track, errors, result, done) {
                done(null, track.buildPath('url', {
                    pageName: 'about',
                    text: 'test'
                }));
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/'
            }, function (err, data) {
                test.strictEqual(data.data + '', '/about/?text=test');
                test.done();
            });
        }
    ],

    'Runtime.prototype.send': [
        function (test) {

            var fist = new Fist();
            var er = new Error();

            fist.route('GET', '/', 'index');

            fist.decl('index', function (track) {
                track.send(500, er);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.strictEqual(data.data + '', er.stack);
                test.strictEqual(data.statusCode, 500);
                test.done();
            });
        },
        function (test) {

            var fist = new Fist({
                staging: true
            });
            var er = new Error();

            fist.route('GET', '/', 'index');

            fist.decl('index', function (track) {
                track.send(500, er);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.strictEqual(data.data + '', 'Internal Server Error');
                test.strictEqual(data.statusCode, 500);
                test.done();
            });
        },
        function (test) {

            var fist = new Fist();
            var er = new Error();

            fist.route('GET', '/', 'index');

            fist.decl('index', function (track) {
                track.send(200, er);
            });

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.strictEqual(data.data + '', '{}');
                test.strictEqual(data.statusCode, 200);
                test.done();
            });
        }
    ],

    'Runtime.prototype.render': [
        function (test) {

            var fist = new Fist();

            fist.plug(function (done) {
                this.renderers.index = function () {
                    return [].slice.call(arguments, 0).map(function (v) {

                        return v * 2;
                    });
                };

                done(null, null);
            });

            fist.decl('index', function (track) {
                track.render('index', 1, 2, 3);
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('[2,4,6]'));
                test.strictEqual(data.statusCode, 200);
                test.done();
            });
        },
        function (test) {

            var fist = new Fist();

            fist.plug(function (done) {
                this.renderers.index = function () {
                    return [].slice.call(arguments, 0).map(function (v) {

                        return v * 2;
                    });
                };

                done(null, null);
            });

            fist.decl('index', function (track) {
                track.render(201, 'index', 1, 2, 3);
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('[2,4,6]'));
                test.strictEqual(data.statusCode, 201);
                test.done();
            });
        }
    ],
    'Runtime.prototype.redirect': [
        function (test) {
            var fist = new Fist();

            fist.decl('index', function (track) {
                track.redirect('/about/');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/about/'));
                test.strictEqual(data.statusCode, 302);
                test.strictEqual(data.headers.location, '/about/');
                test.done();
            });
        },
        function (test) {
            var fist = new Fist();

            fist.decl('index', function (track) {
                track.redirect(301, '/about/');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/about/'));
                test.strictEqual(data.statusCode, 301);
                test.strictEqual(data.headers.location, '/about/');
                test.done();
            });
        },
        function (test) {
            var fist = new Fist();

            fist.decl('index', function (track) {
                track.redirect(333, '/about/');
            });

            fist.route('GET', '/', 'index');

            try {
                Fs.unlinkSync(sock);
            } catch (ex) {}

            fist.listen(sock);

            asker({
                method: 'GET',
                socketPath: sock,
                path: '/',
                statusFilter: function () {

                    return {
                        accept: true
                    };
                }
            }, function (err, data) {
                test.deepEqual(data.data, new Buffer('/about/'));
                test.strictEqual(data.statusCode, 302);
                test.strictEqual(data.headers.location, '/about/');
                test.done();
            });
        }
    ]

};
