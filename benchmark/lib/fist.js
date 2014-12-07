'use strict';

var fist = require('../../fist');
var app = fist();

fist.logging.conf({
    logLevel: 'NOTSET',
    enabled: []
});

app.unit({
    base: '_fist_contrib_unit',
    name: 'base',
    params: {
        toString: function () {
            return '';
        }
    }
});

app.unit({
    base: 'base',
    name: 'a',
    deps: ['b'],
    main: function (track) {
        return track.send('OK');
    }
});

app.unit({
    base: 'base',
    name: 'b',
    deps: ['c'],
    main: function () {
        return 'b';
    }
});

app.unit({
    base: 'base',
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
