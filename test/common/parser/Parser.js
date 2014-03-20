'use strict';

var Parser = require('../../../parser/Parser');
var Parted = require('../../util/Parted');

module.exports = {

    Parser: [
        function (test) {
            var parser;

            parser = new Parser(null);

            test.deepEqual(parser.params, {
                length: Infinity,
                limit: Infinity
            });

            parser = new Parser({
                length: '5',
                limit: 42
            });

            test.deepEqual(parser.params, {
                length: 5,
                limit: 42
            });

            test.done();
        }
    ],

    'Parser.prototype.parse': [
        function (test) {
            var req = new Parted(['h1']);
            var parser = new Parser();

            parser.parse(req).next(function (res) {
                test.deepEqual(res, {});
                test.done();
            });
        }
    ],

    'Parser.ELIMIT': [
        function (test) {

            var error = Parser.ELIMIT({
                message: 'x'
            });

            test.deepEqual(error, {
                code: 'ELIMIT',
                message: 'x'
            });

            test.done();
        }
    ],
    'Parser.ELENGTH': [
        function (test) {

            var error = Parser.ELENGTH({
                message: 'xxx'
            });

            test.deepEqual(error, {
                code: 'ELENGTH',
                message: 'xxx'
            });

            test.done();
        }
    ]
};
