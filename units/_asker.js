'use strict';

var Pattern = /** @type Pattern */ require('finger/route/Pattern');

var _ = require('lodash-node');
var asker = require('asker');
var vow = require('vow');

module.exports = {

    base: '_serial',

    path: '_asker',

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

    _$prepare: function (track, ctx) {

        var data = Object(ctx.data);

        if ( _.isString(data.path) ) {
            data.path = Pattern.buildPath(data.path, data.vars);
        }

        return data;
    },

    _$request: function (track, ctx) {

        var defer = vow.defer();

        asker(ctx.data, function (err, res) {

            if ( err ) {
                defer.reject(err);

            } else {
                defer.resolve(res);
            }
        });

        return defer.promise();
    },

    _$compile: function (track, ctx) {
        ctx.data.data = JSON.parse(ctx.data.data);

        return ctx.data;
    },

    _$resolve: function (track, ctx) {

        return ctx.data.data;
    }

};
