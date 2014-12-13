/*eslint no-console: 0*/
'use strict';

var fist = require('../../fist');
var app = fist();
var f = require('util').format;

app.logger.conf({
    logLevel: 'NOTSET'
});

var routes = 100;
var uniqueId = require('unique-id');
var name;

console.log('%d routes', routes);

function send(track) {
    track.res.end(this.name);
}

while (routes) {
    routes -= 1;
    name = f('unit_%s', uniqueId());

    app.route(f('/<page>/%s/', name), {
        name: name,
        unit: name
    });

    app.unit({
        base: 0,
        name: name,
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
