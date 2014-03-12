'use strict';

var sock = require('../stuff/conf/sock');
var Fist = require('../../Fist');
var Fs = require('fs');
var Path = require('path');
var asker = require('asker');
var routes = require('../stuff/conf/router0');

module.exports = [

    function (test) {

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

    function (test) {

        var fist = new Fist();

        fist.decl('index', function (track) {
            track.send(200);
        });

        fist.route('GET', '/', 'index');

        fist.before(function (done) {
            setTimeout(function () {
                done(null, 42);
            }, 200);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (err) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            socketPath: sock,
            path: '/'
        }, function (err, data) {
            test.strictEqual(data.data + '', 'OK');
            test.done();
        });
    },

    function (test) {

        var fist = new Fist();

        fist.on('error', function (err) {
            test.strictEqual(err, 42);
            test.done();
        });

        fist.before(function (done) {
            setTimeout(function () {
                done(42);
            }, 200);
        });

        fist.ready();
    },

    function (test) {

        var fist = new Fist();

        fist.on('error', function (err) {
            test.strictEqual(err, 42);
            test.done();
        });

        fist.before(function (done) {
            done(42);
        }, function (done) {
            done(null, 43);
        });

        fist.ready();
    }

];
