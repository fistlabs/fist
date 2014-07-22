'use strict';

var Deque = /** @type Deque */ require('double-ended-queue');
var Skip = /** @type Skip */ require('../../skip/skip');

var _ = require('lodash-node');
var vow = require('vow');

module.exports = {

    base: '_unit',

    path: '_serial',

    data: function (track, deps) {

        return this.__next(track, deps, new Deque(this._steps), false);
    },

    _steps: [],

    __next: function (track, ctx, steps, isError) {

        var func;
        var name;
        var self = this;

        if ( steps.isEmpty() || ctx.data instanceof Skip ) {

            return ctx.data;
        }

        name = steps.shift();
        ctx.trigger('ctx:' + name, ctx.data);
        func = this['_$' + name];

        if ( isError && !_.isFunction(func) ) {

            return vow.reject(ctx.data);
        }

        return vow.invoke(function () {

            return func.call(self, track, ctx);
        }).always(function (promise) {

            if ( isError ) {

                return promise;
            }

            ctx.data = promise.valueOf();
            isError = promise.isRejected();

            if ( isError ) {
                steps = new Deque(['e' + name]);
            }

            return this.__next(track, ctx, steps, isError);
        }, this);
    }

};
