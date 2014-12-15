/*eslint no-nested-ternary: 0*/
'use strict';

var fist = require('../../fist');
var app = fist();
var f = require('util').format;

app.logger.conf({
    logLevel: 'NOTSET'
});

var size = 40;

app.route('/<page>/', {
    name: 'index',
    unit: f('unit_%s', size)
});

app.unit({
    base: 0,
    name: f('unit_%s', size),
    deps: [f('unit_%s', size - 1), f('unit_%s', size - 2)],
    main: function (track, context) {
        track.send(context);
    }
});

size -= 1;
function noop() {
    return this.name;
}

while (size) {
    app.unit({
        base: 0,
        name: f('unit_%s', size),
        deps: size < 2 ?
            [] :
            size < 3 ?
                [f('unit_%s', size - 1)] :
                [
                    f('unit_%s', size - 1),
                    f('unit_%s', size - 2)
                ],
        main: noop,
        maxAge: 100,
        hashArgs: noop
    });
    size -= 1;
}

app.listen(1339);
