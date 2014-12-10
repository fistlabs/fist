'use strict';

var fist = require('../../fist');
var app = fist();

app.logger.conf({
    logLevel: 'NOTSET'
});

app.unit({
    base: 0,
    name: 'a',
    deps: ['b'],
    main: function (track) {
        return track.res.end('OK');
    }
});

app.unit({
    base: 0,
    name: 'b',
    deps: ['c'],
    main: function () {
        return 'b';
    }
});

app.unit({
    base: 0,
    name: 'c',
    main: function () {
        return 'c';
    }
});

app.route('/<page>/', {
    name: 'index',
    unit: 'a'
});

app.listen(1337);
