'use strict';

var BodyParser = require('../../../util/BodyParser');
var ContentType = require('../../../util/ContentType');

var http = require('../../util/http');

var _ = require('lodash-node');

module.exports = {

    'BodyParser.prototype.parse': [
        function (test) {

            http({
                method: 'get'
            }, function (req, res) {

                var parser = new BodyParser();

                parser.parse(req, function (err, data) {
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
                var parser = new BodyParser();

                parser.parse(req, function (err, data) {
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
                method: 'get',
                body: 'asd',
                headers: {
                    'content-type': 'text/plain'
                }
            }, function (req, res) {

                var mime = new ContentType(req.headers['content-type']);

                var parser = new BodyParser(_.extend(mime.toParams(), {
                    length: req.headers['content-length']
                }));

                parser.parse(req, function (err, data) {
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

                var mime = new ContentType(req.headers['content-type']);

                var parser = new BodyParser(_.extend(mime.toParams(), {
                    length: req.headers['content-length']
                }));

                parser.parse(req, function (err, data) {
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

                var mime = new ContentType(req.headers['content-type']);

                var parser = new BodyParser(_.extend(mime.toParams(), {
                    length: req.headers['content-length']
                }));

                parser.parse(req, function (err, data) {
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

                var mime = new ContentType(req.headers['content-type']);

                var parser = new BodyParser(_.extend(mime.toParams(), {
                    length: req.headers['content-length']
                }));

                parser.parse(req, function (err) {
                    test.ok(err instanceof SyntaxError);
                    res.end();
                });
            }, function () {
                test.done();
            });
        },
        function (test) {
            http({
                method: 'get',
                headers: {
                    'content-type': 'application/json'
                }
            }, function (req, res) {

                var mime = new ContentType(req.headers['content-type']);

                var parser = new BodyParser(_.extend(mime.toParams(), {
                    length: req.headers['content-length']
                }));

                parser.parse(req, function (err, body) {
                    test.deepEqual(body, {
                        type: void 0,
                        input: {}
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
                body: {
                    dima: 'ok'
                },
                bodyEncoding: 'multipart'
            }, function (req, res) {

                var mime = new ContentType(req.headers['content-type']);

                var parser = new BodyParser(_.extend(mime.toParams(), {
                    length: req.headers['content-length']
                }));

                parser.parse(req, function (err, data) {
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
