'use strict';

var Loader = require('../../../parser/Loader');
var Parted = require('../../util/Parted');
var Parser = require('../../../parser/Parser');
var http = require('../../util/http');

module.exports = {

    done: function (test) {

        http({
            method: 'post',
            body: 'Hello, World!'
        }, function (req, res) {

            var parser = new Loader(req);

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

            var parser = new Loader(req);

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
    },

    options_elimit: function (test) {
        http({
            method: 'post',
            body: 'Hello, World!'
        }, function (req, res) {

            var parser = new Loader(req, {
                limit: 4
            });

            parser.done(function (err, body) {
                test.deepEqual(err, {
                    code: 'ELIMIT',
                    actual: 13,
                    expected: 4
                });
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    options_elength: function (test) {
        http({
            method: 'post',
            body: 'Hello, World!'
        }, function (req, res) {

            var parser = new Loader(req, {
                length: req.headers['content-length'] - 1
            });

            parser.done(function (err, body) {
                test.deepEqual(err, {
                    code: 'ELENGTH',
                    actual: 13,
                    expected: 12
                });
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    custom: function (test) {

        var stream = new Parted('Привет'.split(''));

        var parser = new Loader(stream, {
            limit: 4
        });

        parser.done(function (err) {
            test.deepEqual(err, {
                actual: 6,
                expected: 4,
                code: 'ELIMIT'
            });

            test.done();
        });

    }
};
