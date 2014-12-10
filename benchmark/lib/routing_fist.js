'use strict';

var fist = require('../../fist');
var app = fist();

app.logger.conf({
    logLevel: 'NOTSET'
});

app.unit({
    base: 0,
    name: 'foo',
    main: function (track) {
        return track.res.end('foo');
    }
});

app.unit({
    base: 0,
    name: 'bar',
    main: function (track) {
        return track.res.end('bar');
    }
});

app.unit({
    base: 0,
    name: 'index',
    main: function (track) {
        return track.res.end('index');
    }
});

app.route('/<page>/foo/', 'foo');
app.route('/<page>/bar/', 'bar');
app.route('/<page>/', 'index');

app.listen(1337);
