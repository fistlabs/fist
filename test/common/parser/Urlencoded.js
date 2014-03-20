'use strict';

var Urlencoded = require('../../../parser/Urlencoded');
var Parted = require('../../util/Parted');

module.exports = {

    'Urlencoded.prototype.parse': [
        function (test) {
            var req = new Parted(['a=5&b=6']);
            var parser = new Urlencoded();
            parser.parse(req).next(function (res) {
                test.deepEqual(res, {
                    input: {
                        a: '5',
                        b: '6'
                    },
                    type: 'urlencoded'
                });
                test.done();
            });
        },
        function (test) {
            var req = new Parted(['a=5&b=6']);
            var parser = new Urlencoded();
            parser.parse(req).next(null, function (err) {
                test.strictEqual(err, 42);
                test.done();
            });
            req.once('data', function () {
                req.emit('error', 42);
            });
        }
    ]

};
