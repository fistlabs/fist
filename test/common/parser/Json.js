'use strict';

var Json = require('../../../parser/Json');
var Parted = require('../../util/Parted');

module.exports = {

    'Json.prototype.parse': [
        function (test) {
            var parser = new Json(new Parted(['{"a":42}']));
            parser.parse(function (err, res) {
                test.deepEqual(res, {
                    input: {a: 42},
                    type: 'json'
                });
                test.done();
            });
        },
        function (test) {
            var req = new Parted(['{"a":42}']);
            var parser = new Json(req);
            parser.parse(function (err) {
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

    ]

};
