'use strict';

var serial = require('../../../../util/cookie/serial');

module.exports = {

    serialCookie: function (test) {

        test.strictEqual(serial('NAME', 'VALUE'), 'NAME=VALUE');

        test.strictEqual(serial('NAME', 'VALUE', {}), 'NAME=VALUE');

        test.strictEqual(serial('NAME', 'VALUE', {
            domain: 'yandex.ru',
            secure: true,
            path: '/'
        }), 'NAME=VALUE; domain=yandex.ru; path=/; secure');

        test.strictEqual(serial('NAME', 'VALUE', {
            expires: 0
        }), 'NAME=VALUE; expires=' + (new Date()).toUTCString());

        var d = new Date(9000);

        test.strictEqual(serial('NAME', 'VALUE', {
            expires: String(d)
        }), 'NAME=VALUE; expires=' + d.toUTCString());

        test.strictEqual(serial('NAME', 'VALUE', {
            expires: 'Invalid expires'
        }), 'NAME=VALUE');

        test.done();
    }
};
