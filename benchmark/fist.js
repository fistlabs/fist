'use strict';

var fist = require('../');
var app = fist();

app.unit({
    name: 'a',
    deps: ['b'],
    main: function (track) {

        return track.send();
    }
});

app.unit({
    name: 'b',
    deps: ['c'],
    main: function () {

        return 'b';
    }
});

app.unit({
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
