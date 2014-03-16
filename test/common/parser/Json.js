'use strict';

var Json = require('../../../parser/Json');
var Parted = require('../../util/Parted');

module.exports = {

    'Json.prototype.parse': [
        function (test) {
            var parser = new Json(new Parted(['{"a":42}']));
            parser.parse(function (err, res) {
                test.deepEqual(res, {a: 42});
                test.done();
            });
        },
        function (test) {
            var req = new Parted(['{"a":42}']);
            var parser = new Json(req);
            parser.parse(function (err, res) {
                test.strictEqual(err, '42');
                test.done();
            });

            req.once('data', function () {
                req.emit('error', '42');
            });
        },
        function (test) {
            var req = new Parted(['{"a":42']);
            var parser = new Json(req);
            parser.parse(function (err) {
                test.ok(err instanceof SyntaxError);
                test.done();
            });
        }

    ],

    'Json.isJSON': [
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
    ]
};
