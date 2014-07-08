'use strict';

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

module.exports = {

    base: '_unit',

    path: '_serial',

    data: function (track, deps) {

        return this.__next(track, deps, _.clone(this._steps), false);
    },

    _steps: [],

    __next: function (track, deps, steps, isError) {

        var func;
        var name;
        var self = this;

        if ( this._hasOutsideResolved(track, deps) || 0 === _.size(steps) ) {

            return deps.data;
        }

        name = steps.shift();
        deps.notify([name, deps.data]);
        func = this['_$' + name];

        if ( isError && !_.isFunction(func) ) {

            return vow.reject(deps.data);
        }

        return vow.invoke(function () {

            return func.call(self, track, deps);
        }).always(function (promise) {

            if ( isError ) {

                return promise;
            }

            deps.data = promise.valueOf();
            isError = promise.isRejected();

            if ( isError ) {
                steps = ['e' + name];
            }

            return this.__next(track, deps, steps, isError);
        }, this);
    }

};
