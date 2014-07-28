'use strict';

var Deque = /** @type Deque */ require('double-ended-queue');
var Skip = /** @type Skip */ require('../../core/skip/skip');

var _ = require('lodash-node');
var vow = require('vow');

module.exports = function () {

    this.unit({

        base: '_unit',

        path: '_serial',

        data: function (track, context) {

            return this.__next(context, new Deque(this._steps), false);
        },

        _steps: [],

        __next: function (context, steps, isError) {
            var name;
            var func;
            var self = this;

            if ( steps.isEmpty() || context.data instanceof Skip ) {

                return context.data;
            }

            name = steps.shift();
            func = this['_$' + name];
            context.trigger('ctx:' + name, context.data);

            if ( isError && !_.isFunction(func) ) {

                return vow.reject(context.data);
            }

            return vow.invoke(function () {

                return func.call(self, context.track, context);
            }).always(function (promise) {

                if ( isError ) {

                    return promise;
                }

                context.data = promise.valueOf();
                isError = promise.isRejected();

                if ( isError ) {
                    steps = new Deque(['e' + name]);
                }

                return this.__next(context, steps, isError);
            }, this);
        }

    });
};
