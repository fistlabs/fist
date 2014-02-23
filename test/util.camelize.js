'use strict';

var camelize = require('../util/camelize');

module.exports = {

    camelize: function (test) {

        var samples = [
            ['data', 'data'],
            ['DATA', 'data'],
            ['Data', 'data'],
            ['HttpData', 'httpData'],
            ['HTTPData', 'httpData']
        ];

        samples.forEach(function (s) {
            test.strictEqual(camelize(s[0]), s[1]);
        });

        test.done();
    }

};
