'use strict';

var f = require('util').format;

module.exports = function (app) {
    app.unit({
        base: '_fistlabs_unit_asker',
        name: 'document',
        params: {
            doc: 'index'
        },
        cache: 'local',
        maxAge: 5000,
        options: function (track, context) {
            return {
                protocol: 'http:',
                hostname: 'nodejs.org',
                path: f('/api/%s.json', context.p('doc').toLowerCase()),
                timeout: 10000
            };
        },
        identify: function (track, context) {
            return context.p('doc');
        }
    });
};
