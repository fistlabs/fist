'use strict';

var Control = /** @type Control */ require('../../core/control/control');
var Deque = /** @type Deque */ require('double-ended-queue');

var _ = require('lodash-node');
var vow = require('vow');

module.exports = function () {

    this.unit({

        name: '_contrib-serial',

        main: function (track, context) {

            return this.__next(context, new Deque(this._steps), false);
        },

        _steps: [],

        __next: function (context, steps, isError) {
            var data = context.data;
            var name;
            var func;
            var self = this;

            if (steps.isEmpty() || data instanceof Control) {

                return data;
            }

            name = steps.shift();
            func = this['_$' + name];

            if (isError) {
                if (!_.isFunction(func)) {

                    return vow.reject(data);
                }

                context.logger.bind(name).warn('Running fallback %s', data, data);
            } else {
                context.logger.bind(name).debug('Start processing');
            }

            return vow.invoke(function () {

                return func.call(self, context.track, context);
            }).always(function (promise) {

                if (isError) {

                    return promise;
                }

                context.data = promise.valueOf();
                isError = promise.isRejected();

                if (isError) {
                    steps = new Deque(['e' + name]);
                }

                return this.__next(context, steps, isError);
            }, this);
        }

    });
};
