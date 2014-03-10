'use strict';

var Urlencoded = require('../../../parser/Urlencoded');
var http = require('../../util/http');

module.exports = {

    done: function (test) {
        http({
            method: 'post',
            body: 'a=5&b=6'
        }, function (req, res) {

            var parser = new Urlencoded(req);

            parser.done(function (err, data) {
                test.deepEqual(data.input, {
                    a: '5',
                    b: '6'
                });
                test.deepEqual(data.files, Object.create(null));
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    fail: function (test) {
        http({
            method: 'post',
            body: 'ПРИФФЕТ!'
        }, function (req, res) {

            var parser = new Urlencoded(req);

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

    isUrlencoded: function (test) {

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
            test.ok(Urlencoded.isUrlencoded({
                headers: {
                    'content-type': 'application/' + type
                }
            }));
        });

        nequal.forEach(function (type) {
            test.ok(!Urlencoded.isUrlencoded({
                headers: {
                    'content-type': 'application/' + type
                }
            }));
        });

        test.done();
    }
};
