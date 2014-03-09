'use strict';

var Multipart = require('../../../../util/reader/Multipart');
var http = require('../../../util/http');

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

module.exports = {

    done0: function (test) {

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

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: {
                        first: 'vasya',
                        last: 'petrov'
                    },
                    files: {
                        file: {
                            mime: 'application/octet-stream',
                            name: 'buf',
                            data: new Buffer('asd')
                        }
                    }
                });
                res.end();
            });

        }, function (err) {
            test.ok(!err);
            test.done();
        });
    },

    done1: function (test) {

        http({
            method: 'post',
            body: FIXTURE0
        }, function (req, res) {

            var parser = new Multipart(req, {
                boundary: BOUNDARY
            });

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: {
                        first: ['vasya', 'vasya', 'vasya'],
                        last: 'petrov'
                    },
                    files: {
                        file: {
                            mime: 'application/octet-stream',
                            name: 'buf',
                            data: new Buffer('asd')
                        }
                    }
                });
                res.end();
            });

        }, function (err) {
            test.ok(!err);
            test.done();
        });
    },

    done2: function (test) {

        http({
            method: 'post',
            body: FIXTURE1
        }, function (req, res) {

            var parser = new Multipart(req, {
                boundary: BOUNDARY
            });

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: {
                        last: 'petrov'
                    },
                    files: {
                        file: {
                            mime: 'application/octet-stream',
                            name: 'buf',
                            data: new Buffer('asd')
                        }
                    }
                });
                res.end();
            });

        }, function (err) {
            test.ok(!err);
            test.done();
        });
    },

    fail0: function (test) {
        http({
            method: 'post',
            body: 'ASDAS'
        }, function (req, res) {

            var parser = new Multipart(req, {
                boundary: BOUNDARY
            });

            parser.done(function (err) {
                test.ok(2 > arguments.length);
                res.end();
            });

        }, function (err) {
            test.ok(!err);
            test.done();
        });
    },

    fail1: function (test) {

        http({
            method: 'post',
            body: {
                first: 'vasya',
                last: 'petrov',
                file: {
                    mime: 'application/octet-stream',
                    file: 'buf',
                    data: new Buffer('asd')
                }
            },
            bodyEncoding: 'multipart'
        }, function (req, res) {

            var boundary = Multipart.isMultipart(req);
            var parser = new Multipart(req, {
                boundary: boundary
            });

            req.on('error', function () {});
            req.on('data', function () {
                req.emit('error', 'ERR');
            });

            parser.done(function (err, data) {
                test.strictEqual(err, 'ERR');
                res.end();
            });

        }, function (err) {
            test.ok(!err);
            test.done();
        });
    },

    isMultipart: function (test) {

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
};
