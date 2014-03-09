'use strict';

var BodyParser = require('../../../util/BodyParser');
var http = require('../../util/http');

module.exports = {

    noBody: function (test) {

        http({
            method: 'get'
        }, function (req, res) {

            var parser = new BodyParser(req);

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: {},
                    files: {}
                });
                res.end();
            });
        }, function () {
            test.done();
        });
    },

    raw0: function (test) {
        http({
            method: 'post',
            body: 'asd'
        }, function (req, res) {

            delete req.headers['content-type'];

            var parser = new BodyParser(req);

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: new Buffer('asd'),
                    files: {}
                });
                res.end();
            });
        }, function () {
            test.done();
        });
    },

    raw1: function (test) {
        http({
            method: 'post',
            body: 'asd',
            headers: {
                'content-type': 'text/plain'
            }
        }, function (req, res) {

            var parser = new BodyParser(req);

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: new Buffer('asd'),
                    files: {}
                });
                res.end();
            });
        }, function () {
            test.done();
        });
    },

    urlencoded: function (test) {
        http({
            method: 'post',
            body: 'a=42',
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        }, function (req, res) {

            var parser = new BodyParser(req);

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: {
                        a: '42'
                    },
                    files: {}
                });
                res.end();
            });
        }, function () {
            test.done();
        });
    },

    json: function (test) {
        http({
            method: 'post',
            body: '{"a": "42"}',
            headers: {
                'content-type': 'application/json'
            }
        }, function (req, res) {

            var parser = new BodyParser(req);

            parser.done(function (err, data) {
                test.deepEqual(data, {
                    input: {
                        a: '42'
                    },
                    files: {}
                });
                res.end();
            });
        }, function () {
            test.done();
        });
    },

    multipart: function (test) {
        http({
            method: 'post',
            body: '{"a": "42"}',
            headers: {
                'content-type': 'multipart/form-data; boundary=asd'
            }
        }, function (req, res) {

            var parser = new BodyParser(req);

            parser.done(function (err, data) {
                test.ok(err);
                res.end();
            });
        }, function () {
            test.done();
        });
    }
};
