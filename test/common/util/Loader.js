'use strict';

var Loader = require('../../../util/Loader');
var http = require('../../util/http');

module.exports = {

    done: function (test) {

        http({
            method: 'post',
            body: 'Hello, World!'
        }, function (req, res) {

            var parser = new Loader(req);

            parser.done(function (err, buf) {
                test.ok(Buffer.isBuffer(buf));
                test.deepEqual(buf, new Buffer(0));
                res.end();
            });

        }, function () {
            test.done();
        });
    }
};
