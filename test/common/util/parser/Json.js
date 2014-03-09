'use strict';

var Json = require('../../../../util/parser/Json');
var http = require('../../../util/http');

module.exports = {

    done: function (test) {
        http({
            method: 'post',
            body: '{"a":42}'
        }, function (req, res) {

            var parser = new Json(req);

            parser.done(function (err, data) {
                test.deepEqual(data.input, {
                    a: '42'
                });
                test.deepEqual(data.files, Object.create(null));
                res.end();
            });
        }, function () {
            test.done();
        });
    },

    fail0: function (test) {
        http({
            method: 'post',
            body: 'ПРИФФЕТ!'
        }, function (req, res) {

            var parser = new Json(req);

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

    fail1: function (test) {
        http({
            method: 'post',
            body: 'ПРИФФЕТ!'
        }, function (req, res) {

            var parser = new Json(req);

            parser.done(function (err) {
                test.ok(err instanceof SyntaxError);
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    isJSON: function (test) {

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
            test.ok(Json.isJSON({
                headers: {
                    'content-type': 'application/' + type
                }
            }));
        });

        nequal.forEach(function (type) {
            test.ok(!Json.isJSON({
                headers: {
                    'content-type': 'application/' + type
                }
            }));
        });

        test.done();
    }
};
