'use strict';

var SOCK = 'test/conf/fist.sock';
var Fist = require('../Fist');
var Fs = require('fs');
var Path = require('path');
var asker = require('asker');

module.exports = {

    Fist0: function (test) {

        var fist = new Fist({
            dirs: [
                'test/data',
                'test/stuff'
            ],
            conf: Path.resolve('test/conf/router.json')
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
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'GET',
            timeout: 10000,
            socketPath: SOCK,
            path: '/'
        }, function (err, data) {

            test.strictEqual(data.data + '', JSON.stringify({
                result: {
                    className: 'by-stuff',
                    data: 42,
                    action: {
                        dirs: [
                            'test/data',
                            'test/stuff'
                        ],
                        conf: Path.resolve('test/conf/router.json')
                    }
                },
                errors: {
                    error: 'error'
                }
            }));

            test.deepEqual(spy, {
                rq: ['/'],
                ac: ['abbr', 'className', 'data', 'action'],
                rj: ['error'],
                rs: ['/'],
                mt: ['/']
            });

            test.done();
        });
    },

    Fist1: function (test) {

        var fist = new Fist({
            dirs: [
                'asdasd',
                'test/data'
            ],
            conf: Path.resolve('test/conf/router.json')
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        process.on('uncaughtException', function (ex) {
            test.done();
        });

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK
        }, function (err, res) {

        });
    },

    Fist2: function (test) {

        var fist = new Fist({
            dirs: [],
            conf: Path.resolve('test/conf/router.json')
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (err) {}

        fist.listen(SOCK);

        asker({
            method: 'get',
            path: '/',
            socketPath: SOCK,
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
    }
};
