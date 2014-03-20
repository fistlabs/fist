'use strict';

var Json = require('../../../parser/Json');
var Parted = require('../../util/Parted');

module.exports = {

    'Json.prototype.parse': [
        function (test) {
            var parser = new Json();
            parser.parse(new Parted(['{"a":42}'])).next(function (res) {
                test.deepEqual(res, {a: 42});
                test.done();
            });
        },
        function (test) {
            var req = new Parted(['{"a":42}']);
            var parser = new Json();
            parser.parse(req).next(null, function (err) {
                test.strictEqual(err, '42');
                test.done();
            });

            req.once('data', function () {
                req.emit('error', '42');
            });
        },
        function (test) {
            var req = new Parted(['{"a":42']);
            var parser = new Json();
            parser.parse(req).next(null, function (err) {
                test.ok(err instanceof SyntaxError);
                test.done();
            });
        }
    ]

};
