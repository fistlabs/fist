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
    base: '_fistlabs_unit_depends',
    name: f('unit_%s', size),
    deps: [f('unit_%s', size - 1)],
    main: function (context) {
        context.res.end('OK');
    }
});

size -= 1;
function noop() {}

while (size) {
    app.unit({
        base: '_fistlabs_unit_depends',
        name: f('unit_%s', size),
        deps: size === 1 ? [] : [f('unit_%s', size - 1)],
        main: noop
    });
    size -= 1;
}

app.listen(1337);
