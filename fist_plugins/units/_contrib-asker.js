'use strict';

var vowAsker = require('vow-asker');

module.exports = function () {

    this.unit({

        base: '_contrib-serial',

        name: '_contrib-asker',

        _steps: [
            'options',
            'prepare',
            'request',
            'compile',
            'resolve'
        ],

        _$options: function () {

            return {};
        },

        _$prepare: function (track, context) {
            var data = Object(context.data);
            var path = data.path;

            if (path && typeof path === 'object' && typeof path.build === 'function') {
                data.path = path.build(data.vars);
            }

            return data;
        },

        _$request: function (track, context) {

            return vowAsker(context.data);
        },

        _$compile: function (track, context) {
            context.data.data = JSON.parse(context.data.data);

            return context.data;
        },

        _$resolve: function (track, context) {

            return context.data.data;
        }

    });

};
