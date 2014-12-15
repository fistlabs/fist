/*eslint no-console: 0*/
'use strict';

var fist = require('../../fist');
var app = fist();

console.log('1 route, just send OK');

app.logger.conf({
    logLevel: 'NOTSET'
});

app.route('/index/', {
    name: 'index',
    unit: 'index'
});

app.unit({
    name: 'index',
    main: function (track) {
        track.res.end('OK');
    }
});

app.listen(1337);
