'use strict';

var Multipart = require('../../../parser/Multipart');
var Parted = require('../../util/Parted');
var http = require('../../util/http');
var ContentType = require('../../../util/ContentType');

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
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="last"',
    '',
    'petrov',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="file"; filename="buf"',
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

var FIXTURE3 = [
    '--' + BOUNDARY,
    'content-disposition: form-data; name=first; filename=""',
    '',
    'vasya',
    '--' + BOUNDARY,
    'content-disposition: form-data; name="last"',
    '',
    'petrov',
    '--' + BOUNDARY + '--'
].join('\r\n');

module.exports = {

    'Multipart.prototype.parse': [
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

                var boundary = new ContentType(req.headers['content-type']).
                    params.boundary;

                var parser = new Multipart({
                    boundary: boundary
                });

                parser.parse(req).done(function (data) {
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

                var parser = new Multipart({
                    boundary: BOUNDARY
                });

                parser.parse(req).done(function (data) {
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

                var parser = new Multipart({
                    boundary: BOUNDARY
                });

                parser.parse(req).done(function (data) {
                    test.deepEqual(data, [
                        {
                            last: 'petrov'
                        },
                        {
                            file: {
                                mime: void 0,
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

                var parser = new Multipart({
                    boundary: BOUNDARY
                });

                parser.parse(req).fail(function (err) {
                    test.ok(err);
                    res.end();
                }).done();

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

                var boundary = new ContentType(req.headers['content-type']).
                    params.boundary;

                var parser = new Multipart({
                    boundary: boundary
                });

                req.on('error', function () {});
                req.once('data', function () {
                    req.emit('error', 'ERR');
                });

                parser.parse(req).fail(function (err) {
                    test.strictEqual(err, 'ERR');
                    res.end();
                }).done();

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

                var boundary = new ContentType(req.headers['content-type']).
                    params.boundary;

                var parser = new Multipart({
                    boundary: boundary
                });

                req.on('error', function () {});
                req.once('error', function (err) {
                    req.emit('error', err);
                });

                parser.parse(req).fail(function (err) {
                    test.strictEqual(err, 'ERR');
                    res.end();
                }).done();

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

                var boundary = new ContentType(req.headers['content-type']).
                    params.boundary;

                var parser = new Multipart({
                    boundary: boundary,
                    length: 4
                });

                parser.parse(req).fail(function (err) {
                    test.strictEqual(err.code, 'ELENGTH');
                    res.end();
                }).done();

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        },
        function (test) {

            var stream = new Parted(FIXTURE2.split(''));

            var parser = new Multipart({
                boundary: BOUNDARY,
                limit: 4
            });

            parser.parse(stream).fail(function (err) {
                test.deepEqual(err, {
                    code: 'ELIMIT',
                    actual: 5,
                    expected: 4
                });
                test.done();
            }).done();
        },
        function (test) {

            http({
                method: 'post',
                body: FIXTURE3
            }, function (req, res) {

                var parser = new Multipart({
                    boundary: BOUNDARY
                });

                parser.parse(req).done(function (data) {
                    test.deepEqual(data, [
                        {
                            first: 'vasya',
                            last: 'petrov'
                        },
                        {}
                    ]);
                    res.end();
                });

            }, function (err) {
                test.ok(!err);
                test.done();
            });
        }
    ]

};
