'use strict';

var Cookie = require('../../../util/Cookie');
var cookie = new Cookie();

module.exports = {

    parseCookie: function (test) {
        test.deepEqual(cookie.parse(' a=5; b=6,c=7=8; d="\\"" ;asd;e="'), {
            a: '5',
            b: '6',
            c: '7=8',
            d: '"',
            e: '"'
        });

        test.deepEqual(cookie.parse(), {});

        test.done();
    },

    serialCookie: function (test) {

        test.strictEqual(cookie.serial('NAME', 'VALUE'), 'NAME=VALUE');

        test.strictEqual(cookie.serial('NAME', 'VALUE', {}), 'NAME=VALUE');

        test.strictEqual(cookie.serial('NAME', 'VALUE', {
            domain: 'yandex.ru',
            secure: true,
            path: '/'
        }), 'NAME=VALUE; domain=yandex.ru; path=/; secure');

        test.strictEqual(cookie.serial('NAME', 'VALUE', {
            expires: 0
        }), 'NAME=VALUE; expires=' + (new Date()).toUTCString());

        var d = new Date(9000);

        test.strictEqual(cookie.serial('NAME', 'VALUE', {
            expires: String(d)
        }), 'NAME=VALUE; expires=' + d.toUTCString());

        test.strictEqual(cookie.serial('NAME', 'VALUE', {
            expires: 'Invalid expires'
        }), 'NAME=VALUE');

        test.done();
    }
};
