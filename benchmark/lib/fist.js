'use strict';

var fist = require('../../fist');
var app = fist();

fist.logging.conf({
    logLevel: 'NOTSET',
    enabled: []
});

app.unit({
    base: '_fist_contrib_unit',
    name: 'a',
    deps: ['b'],
    params: {
        toString: function () {}
    },
    main: function (track) {
        return track.send('OK');
    }
});

app.unit({
    base: '_fist_contrib_unit',
    name: 'b',
    deps: ['c'],
    params: {
        toString: function () {}
    },
    main: function () {
        return 'b';
    }
});

app.unit({
    base: '_fist_contrib_unit',
    name: 'c',
    params: {
        toString: function () {}
    },
    main: function () {
        return 'c';
    }
});

app.route('/<page>/', {
    name: 'index',
    unit: 'a'
});

app.listen(1337);
