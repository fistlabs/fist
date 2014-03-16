'use strict';

var Urlencoded = require('../../../parser/Urlencoded');
var Parted = require('../../util/Parted');

module.exports = {

    'Urlencoded.prototype.parse': [
        function (test) {
            var req = new Parted(['a=5&b=6']);
            var parser = new Urlencoded(req);
            parser.parse(function (err, res) {
                test.deepEqual(res, {
                    a: '5',
                    b: '6'
                });
                test.done();
            });
        },
        function (test) {
            var req = new Parted(['a=5&b=6']);
            var parser = new Urlencoded(req);
            parser.parse(function (err) {
                test.strictEqual(err, 42);
                test.done();
            });
            req.once('data', function () {
                req.emit('error', 42);
            });
        }
    ],

    isUrlencoded: [
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
    ]
};
