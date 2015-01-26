'use strict';

module.exports = function (app) {
    app.unit({
        name: 'hello_page',
        deps: ['greeting_data'],
        main: function (track, context) {
            track.send(context.r('greeting_data.helloText'));
        }
    });
};
