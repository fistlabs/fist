'use strict';

var Cookie = require('../../../util/Cookie');
var cookie = new Cookie();

module.exports = {

    'Cookie.prototype.parse': [
        function (test) {
            test.deepEqual(cookie.parse(' a=5; b=6,c=7=8; d="\\"" ;asd;e="'), {
                a: '5',
                b: '6',
                c: '7=8',
                d: '"',
                e: '"'
            });

            test.deepEqual(cookie.parse({NOT_A_STRING: 0}), {});

            test.done();
        }
    ],

    'Cookie.prototype.serialize': [
        function (test) {

            test.strictEqual(cookie.
                serialize('NAME', 'VALUE'), 'NAME=VALUE');

            test.strictEqual(cookie.
                serialize('NAME', 'VALUE', {}), 'NAME=VALUE');

            test.strictEqual(cookie.serialize('NAME', 'VALUE', {
                domain: 'yandex.ru',
                secure: true,
                path: '/'
            }), 'NAME=VALUE; domain=yandex.ru; path=/; secure');

            test.strictEqual(cookie.serialize('NAME', 'VALUE', {
                expires: 0
            }), 'NAME=VALUE; expires=' + (new Date()).toUTCString());

            var d = new Date(9000);

            test.strictEqual(cookie.serialize('NAME', 'VALUE', {
                expires: String(d)
            }), 'NAME=VALUE; expires=' + d.toUTCString());

            test.strictEqual(cookie.serialize('NAME', 'VALUE', {
                expires: d
            }), 'NAME=VALUE; expires=' + d.toUTCString());

            test.strictEqual(cookie.serialize('NAME', 'VALUE', {
                expires: 'Invalid expires'
            }), 'NAME=VALUE');

            test.done();
        }
    ]
};
