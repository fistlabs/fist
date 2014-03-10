'use strict';

var Parser = require('../../../parser/Parser');
var http = require('../../util/http');

module.exports = {

    done: function (test) {
        http({method: 'post', body: 'hi'}, function (req, res) {
            var parser = new Parser(req);

            parser.done(function (err, buf) {
                test.ok(Buffer.isBuffer(buf));
                test.deepEqual(buf, new Buffer(0));
                res.end();
            });

        }, function () {
            test.done();
        });
    },

    errors: function (test) {

        var error = Parser.ELIMIT({
            message: 'x'
        });

        test.deepEqual(error, {
            code: 'ELIMIT',
            message: 'x'
        });

        error = Parser.ELENGTH({
            message: 'xxx'
        });

        test.deepEqual(error, {
            code: 'ELENGTH',
            message: 'xxx'
        });

        test.done();
    }
};
