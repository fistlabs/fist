'use strict';

var Raw = require('../../../../util/reader/Raw');
var http = require('../../../util/http');

module.exports = {

    done: function (test) {
        http({
            method: 'post',
            body: 'ПРИФФЕТ!'
        }, function (req, res) {

            var parser = new Raw(req);

            parser.done(function (err, data) {
                test.ok(Buffer.isBuffer(data.input));
                test.strictEqual(String(data.input), 'ПРИФФЕТ!');
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

            var parser = new Raw(req);

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
    }
};
