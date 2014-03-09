'use strict';

var StreamLoader = require('../../../util/StreamLoader');
var http = require('../../util/http');

module.exports = {

    done: function (test) {

        http({
            method: 'post',
            body: 'Hello, World!'
        }, function (req, res) {

            var parser = new StreamLoader(req);

            parser.done(function (err, buf) {
                test.ok(Buffer.isBuffer(buf));
                test.strictEqual(String(buf), 'Hello, World!');
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    fail: function (test) {

        http({
            method: 'post',
            body: 'Hello, World!'
        }, function (req, res) {

            var parser = new StreamLoader(req);

            req.on('data', function () {
                req.emit('error', 'ERR');
            });

            parser.done(function (err) {
                test.strictEqual(err, 'ERR');
                res.end();
            });

        }, function () {
            test.done();
        });
    }
};
