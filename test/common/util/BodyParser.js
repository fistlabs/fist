'use strict';

var BodyParser = require('../../../util/BodyParser');
var http = require('../../util/http');

module.exports = {

    'BodyParser.prototype.parse': [
        function (test) {

            http({
                method: 'get'
            }, function (req, res) {

                var parser = new BodyParser();

                parser.parse(req).next(function (data) {
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

                var parser = new BodyParser();

                parser.parse(req).next(function (data) {
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

                var parser = new BodyParser();

                parser.parse(req).next(function (data) {
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

                var parser = new BodyParser();

                parser.parse(req).next(function (data) {
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

                var parser = new BodyParser(req);

                parser.parse(req).next(function (data) {
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

                var parser = new BodyParser();

                parser.parse(req).next(null, function (err) {
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

                var parser = new BodyParser();

                parser.parse(req).next(function (data) {
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
    ],

    'BodyParser.isJSON': [
        function (test) {

            var equal = [
                'json+schema',
                'schema+json',
                'bunker-schema+json',
                'bunker.schema+JSON; charset=utf-8',
                'json',
                'json+bunker.schema'
            ];

            var nequal = [
                'octet-stream',
                '+json',
                'json+',
                'schema+json+schema'
            ];

            equal.forEach(function (type) {
                test.ok(BodyParser.isJSON({
                    headers: {
                        'content-type': 'application/' + type
                    }
                }));
            });

            nequal.forEach(function (type) {
                test.ok(!BodyParser.isJSON({
                    headers: {
                        'content-type': 'application/' + type
                    }
                }));
            });

            test.done();
        }
    ],

    'BodyParser.isMultipart': [
        function (test) {

            var equal = [
                'multipart/form-data; BOUNDARY=BOUNDARY',
                'multipart/mixed; boundary=BOUNDARY'
            ];

            var nequal = [
                'multipart/form-data; boundary',
                'text/plain'
            ];

            equal.forEach(function (type) {
                test.ok(BodyParser.isMultipart({
                    headers: {
                        'content-type': type
                    }
                }));
            });

            nequal.forEach(function (type) {
                test.ok(!BodyParser.isMultipart({
                    headers: {
                        'content-type': type
                    }
                }));
            });

            test.done();
        }
    ],

    'BodyParser.isUrlencoded': [
        function (test) {

            var equal = [
                'x-www-form-urlencoded',
                'x-www-form-urlencoded; charset=UTF8',
                'x-www-form-URLENCODED'
            ];

            var nequal = [
                'octet-stream',
                '+json',
                'json+',
                'schema+json+schema'
            ];

            equal.forEach(function (type) {
                test.ok(BodyParser.isUrlencoded({
                    headers: {
                        'content-type': 'application/' + type
                    }
                }));
            });

            nequal.forEach(function (type) {
                test.ok(!BodyParser.isUrlencoded({
                    headers: {
                        'content-type': 'application/' + type
                    }
                }));
            });

            test.done();
        }
    ]

};
