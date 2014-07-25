'use strict';

var Pattern = /** @type Pattern */ require('finger/route/Pattern');

var _ = require('lodash-node');
var asker = require('asker');
var vow = require('vow');

module.exports = function () {

    this.unit({

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

        _$prepare: function (context) {

            var data = Object(context.data);

            if ( _.isString(data.path) ) {
                data.path = Pattern.buildPath(data.path, data.vars);
            }

            return data;
        },

        _$request: function (context) {

            var defer = vow.defer();

            asker(context.data, function (err, res) {

                if ( err ) {
                    defer.reject(err);

                } else {
                    defer.resolve(res);
                }
            });

            return defer.promise();
        },

        _$compile: function (context) {
            context.data.data = JSON.parse(context.data.data);

            return context.data;
        },

        _$resolve: function (context) {

            return context.data.data;
        }

    });

};
