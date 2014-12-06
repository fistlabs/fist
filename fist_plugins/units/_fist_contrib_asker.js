'use strict';

var vowAsker = require('vow-asker');

module.exports = function () {

    this.unit({

        base: '_fist_contrib-serial',

        name: '_fist_contrib-asker',

        series: [
            '_options',
            '_prepare',
            '_request',
            '_compile',
            '_resolve'
        ],

        _options: function () {

            return {};
        },

        _prepare: function (track, context) {
            var data = Object(context.data);
            var path = data.path;

            if (path && typeof path.build === 'function') {
                data.path = path.build(data.vars);
            }

            return data;
        },

        _request: function (track, context) {

            return vowAsker(context.data);
        },

        _compile: function (track, context) {
            context.data.data = JSON.parse(context.data.data);

            return context.data;
        },

        _resolve: function (track, context) {

            return context.data.data;
        }

    });

};
