'use strict';

var Pattern = /** @type Pattern */ require('finger/route/Pattern');

var _ = require('lodash-node');
var vowAsker = require('vow-asker');

module.exports = function () {

    this.unit({

        base: '_contrib-serial',

        path: '_contrib-asker',

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

            if ( _.isString(data.path) ) {
                data.path = Pattern.buildPath(data.path, data.vars);
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
