'use strict';

var parse = require('../../../../util/cookie/parse');

module.exports = {

    parseCookie: function (test) {
        test.deepEqual(parse(' a=5; b=6,c=7=8; d="\\"" ;asd;e="'), {
            a: '5',
            b: '6',
            c: '7=8',
            d: '"',
            e: '"'
        });

        test.deepEqual(parse(), {});

        test.done();
    }
};
