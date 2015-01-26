'use strict';

module.exports = function (app) {
    app.unit({
        name: 'greeting_data',
        main: function (track, context) {
            return {
                helloText: 'Hello, ' + context.p('name')
            };
        },
        params: {
            name: 'what is your name?'
        }
    });
};
