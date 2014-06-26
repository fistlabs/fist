'use strict';

var fist = require('../');
var app = fist();

app.unit({
    path: 'a',
    deps: ['b'],
    data: function (track) {

        return track.send();
    }
});

app.unit({
    path: 'b',
    deps: ['c'],
    data: function () {

        return 'b';
    }
});

app.unit({
    path: 'c',
    data: function () {

        return 'c';
    }
});

app.route('/<page>/', {
    name: 'index',
    unit: 'a'
});

app.listen(1337);
