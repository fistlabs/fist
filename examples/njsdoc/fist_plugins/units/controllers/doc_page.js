'use strict';

var marked = require('marked');

module.exports = function (app) {
    app.unit({
        base: '_fistlabs_unit_controller',
        name: 'doc_page',
        rule: 'GET /(<doc>.html) i',
        deps: ['document'],
        defaultViewName: 'doc_page.jade',
        main: function (track, context) {
            var error = context.e('document');

            if (error) {
                if (context.e('document.data.statusCode') === 404) {
                    return track.status(404).send();
                }

                throw error;
            }

            context.md = marked;

            this.__base(track, context);
        }
    });
};
