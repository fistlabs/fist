'use strict';

var Reader = require('../../../../util/reader/Reader');
var http = require('../../../util/http');

module.exports = {

    done: function (test) {
        http({method: 'post', body: 'hi'}, function (req, res) {
            var parser = new Reader(req);

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

        var error = Reader.ELIMIT({
            message: 'x'
        });

        test.deepEqual(error, {
            code: 'ELIMIT',
            message: 'x'
        });

        test.ok(!Reader.isELIMIT());
        test.ok(Reader.isELIMIT(error));

        error = Reader.ELENGTH({
            message: 'xxx'
        });

        test.deepEqual(error, {
            code: 'ELENGTH',
            message: 'xxx'
        });

        test.ok(!Reader.isELENGTH(Reader.ELIMIT()));
        test.ok(Reader.isELENGTH(error));

        test.done();
    }
};
