/*eslint no-console: 0*/
'use strict';

var fist = require('../../fist');
var app = fist();
var f = require('util').format;
var routes = 100;
var uniqueId = require('unique-id');
var unitName;

app.logger.conf({
    logLevel: 'NOTSET'
});

console.log('%d routes, last matching', routes);

function send(track) {
    track.res.end(this.name);
}

while (routes) {
    routes -= 1;
    unitName = f('unit_%s', uniqueId());

    app.route(f('/<page>/%s/', unitName), {
        name: unitName,
        unit: unitName
    });

    app.unit({
        base: 0,
        name: unitName,
        main: send
    });
}

app.route('/<page>/', {
    name: 'index',
    unit: 'index'
});

app.unit({
    base: 0,
    name: 'index',
    main: send
});

app.listen(1337);
