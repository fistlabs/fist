'use strict';

var Multipart = require('../../../parser/Multipart');
var Parted = require('../../util/Parted');
var http = require('../../util/http');

var BOUNDARY = 'AskerBoundary-7691254443489015';
var FIXTURE0 = [
    '--' + BOUNDARY,
    'content-disposition: form-data; name=first',
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="first"',
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="first"',
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="last"',
    '',
    'petrov',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="file"; filename=buf',
    'content-type: application/octet-stream',
    '',
    'asd',
    '--' + BOUNDARY + '--'
].join('\r\n');

var FIXTURE1 = [
    '--' + BOUNDARY,
//    'content-disposition: form-data; name="first"',
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="last"',
    '',
    'petrov',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="file"; filename="buf"',
    'content-type: application/octet-stream',
    '',
    'asd',
    '--' + BOUNDARY + '--'
].join('\r\n');

var FIXTURE2 = [
    '--' + BOUNDARY,
    'content-disposition: form-data; name=first',
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="last"',
    '',
    'petrov',
    '--' + BOUNDARY + '--'
].join('\r\n');

module.exports = {

    parse: [
        function (test) {

            http({
                method: 'post',
                body: {
                    first: 'vasya',
                    last: 'petrov',
                    file: {
                        filename: 'buf',
                        data: new Buffer('asd')
                    }
                },
                bodyEncoding: 'multipart'
            }, function (req, res) {

                var boundary = Multipart.isMultipart(req);
                var parser = new Multipart(req, {
                    boundary: boundary
                });

                parser.parse(function (err, data) {
                    test.deepEqual(data, [
                        {
                            first: 'vasya',
                            last: 'petrov'
                        },
                        {
                            file: {
                                mime: 'application/octet-stream',
                                name: 'buf',
                                data: new Buffer('asd')
                            }
                        }
                    ]);
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {

            http({
                method: 'post',
                body: FIXTURE0
            }, function (req, res) {

                var parser = new Multipart(req, {
                    boundary: BOUNDARY
                });

                parser.parse(function (err, data) {
                    test.deepEqual(data, [
                        {
                            first: ['vasya', 'vasya', 'vasya'],
                            last: 'petrov'
                        },
                        {
                            file: {
                                mime: 'application/octet-stream',
                                name: 'buf',
                                data: new Buffer('asd')
                            }
                        }
                    ]);
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {

            http({
                method: 'post',
                body: FIXTURE1
            }, function (req, res) {

                var parser = new Multipart(req, {
                    boundary: BOUNDARY
                });

                parser.parse(function (err, data) {
                    test.deepEqual(data, [
                        {
                            last: 'petrov'
                        },
                        {
                            file: {
                                mime: 'application/octet-stream',
                                name: 'buf',
                                data: new Buffer('asd')
                            }
                        }
                    ]);
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({
                method: 'post',
                body: 'ASDAS'
            }, function (req, res) {

                var parser = new Multipart(req, {
                    boundary: BOUNDARY
                });

                parser.parse(function (err) {
                    test.ok(2 > arguments.length);
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {

            http({
                method: 'post',
                body: {
                    first: 'vasya',
                    last: 'petrov'
                },
                bodyEncoding: 'multipart'
            }, function (req, res) {

                var boundary = Multipart.isMultipart(req);
                var parser = new Multipart(req, {
                    boundary: boundary
                });

                req.on('error', function () {});
                req.once('data', function () {
                    req.emit('error', 'ERR');
                });

                parser.parse(function (err) {
                    test.strictEqual(err, 'ERR');
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {

            http({
                method: 'post',
                body: {
                    first: 'vasya',
                    last: 'petrov'
                },
                bodyEncoding: 'multipart'
            }, function (req, res) {

                var boundary = Multipart.isMultipart(req);
                var parser = new Multipart(req, {
                    boundary: boundary
                });

                req.on('error', function () {});
                req.once('error', function (err) {
                    req.emit('error', err);
                });

                parser.parse(function (err) {
                    test.strictEqual(err, 'ERR');
                    res.end();
                });

                req.once('data', function () {
                    req.emit('error', 'ERR');
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {
            http({
                method: 'post',
                body: {
                    first: 'vasya'
                },
                bodyEncoding: 'multipart'
            }, function (req, res) {

                var boundary = Multipart.isMultipart(req);

                var parser = new Multipart(req, {
                    boundary: boundary,
                    length: 4
                });

                parser.parse(function (err) {
                    test.strictEqual(err.code, 'ELENGTH');
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {

            var stream = new Parted(FIXTURE2.split(''));

            var parser = new Multipart(stream, {
                boundary: BOUNDARY,
                limit: 4
            });

            parser.parse(function (err) {
                test.deepEqual(err, {
                    code: 'ELIMIT',
                    actual: 5,
                    expected: 4
                });
                test.done();
            });
        }
    ],

    isMultipart: [
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
                test.ok(Multipart.isMultipart({
                    headers: {
                        'content-type': type
                    }
                }));
            });

            nequal.forEach(function (type) {
                test.ok(!Multipart.isMultipart({
                    headers: {
                        'content-type': type
                    }
                }));
            });

            test.done();
        }
    ]

};
