'use strict';

var fist = require('../');
var app = fist();

app.unit({
    name: 'a',
    deps: ['b'],
    data: function (track) {

        return track.send();
    }
});

app.unit({
    name: 'b',
    deps: ['c'],
    data: function () {

        return 'b';
    }
});

app.unit({
    name: 'c',
    data: function () {

        return 'c';
    }
});

app.route('/<page>/', {
    name: 'index',
    unit: 'a'
});

app.listen(1337);
