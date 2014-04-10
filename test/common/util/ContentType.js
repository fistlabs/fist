'use strict';

var ContentType = require('../../../util/ContentType');

module.exports = {

    ContentType: [
        function (test) {

            var header = 'multipart/form-data;' +
                'boundary=BOUNDARY;' +
                'charset="UTF-8"';

            test.deepEqual(new ContentType(header), {
                type: 'multipart',
                subtype: 'form-data',
                params: {
                    boundary: 'BOUNDARY',
                    charset: 'UTF-8'
                }
            });

            test.done();
        },
        function (test) {

            var media;
            var srcParams = 'text/html;a=5;b=6;c=7;a=55;a=555';

            media = new ContentType(srcParams);

            test.deepEqual(media, {
                type: 'text',
                subtype: 'html',
                params: {
                    a: ['5', '55', '555'],
                    b: '6',
                    c: '7'
                }
            });

            test.done();
        },
        function (test) {
            test.deepEqual(new ContentType('text/plain;' +
                'a=1; a =2; a = "3";a="\\"" ;'), {
                type: 'text',
                subtype: 'plain',
                params: {
                    a: ['1', '2', '3', '"']
                }
            });
            test.done();
        }
    ]
};
