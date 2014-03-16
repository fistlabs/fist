'use strict';

var Body = require('../../../parser/Body');
var http = require('../../util/http');

module.exports = {

    'Body.prototype.parse': [
        function (test) {

            http({
                method: 'get'
            }, function (req, res) {

                var parser = new Body(req);

                parser.parse(function (err, data) {
                    test.deepEqual(data, {
                        input: {},
                        type: void 0
                    });
                    res.end();
                });
            }, function () {
                test.done();
            });
        },
        function (test) {
            http({
                method: 'post',
                body: 'asd'
            }, function (req, res) {

                delete req.headers['content-type'];

                var parser = new Body(req);

                parser.parse(function (err, data) {
                    test.deepEqual(data, {
                        input: new Buffer('asd'),
                        type: 'raw'
                    });
                    res.end();
                });
            }, function () {
                test.done();
            });
        },
        function (test) {
            http({
                method: 'post',
                body: 'asd',
                headers: {
                    'content-type': 'text/plain'
                }
            }, function (req, res) {

                var parser = new Body(req);

                parser.parse(function (err, data) {
                    test.deepEqual(data, {
                        input: new Buffer('asd'),
                        type: 'raw'
                    });
                    res.end();
                });
            }, function () {
                test.done();
            });
        },

        function (test) {
            http({
                method: 'post',
                body: 'a=42',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            }, function (req, res) {

                var parser = new Body(req);

                parser.parse(function (err, data) {
                    test.deepEqual(data, {
                        input: {
                            a: '42'
                        },
                        type: 'urlencoded'
                    });
                    res.end();
                });
            }, function () {
                test.done();
            });
        },

        function (test) {
            http({
                method: 'post',
                body: '{"a": "42"}',
                headers: {
                    'content-type': 'application/json'
                }
            }, function (req, res) {

                var parser = new Body(req);

                parser.parse(function (err, data) {
                    test.deepEqual(data, {
                        input: {
                            a: '42'
                        },
                        type: 'json'
                    });
                    res.end();
                });
            }, function () {
                test.done();
            });
        },
        function (test) {
            http({
                method: 'post',
                body: '{"a": "42}',
                headers: {
                    'content-type': 'application/json'
                }
            }, function (req, res) {

                var parser = new Body(req);

                parser.parse(function (err) {
                    test.ok(err instanceof SyntaxError);
                    res.end();
                });
            }, function () {
                test.done();
            });
        },

        function (test) {
            http({
                method: 'post',
                body: {
                    dima: 'ok'
                },
                bodyEncoding: 'multipart'
            }, function (req, res) {

                var parser = new Body(req);

                parser.parse(function (err, data) {
                    test.deepEqual(data, {
                        input: {
                            dima: 'ok'
                        },
                        files: {},
                        type: 'multipart'
                    });
                    res.end();
                });
            }, function () {
                test.done();
            });
        }
    ]
};
