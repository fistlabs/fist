'use strict';

var Control = /** @type Control */ require('../control/control');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Context
 * */
var Context = inherit(/** @lends Context.prototype */ {

    /**
     * @protected
     * @memberOf {Context}
     * @method
     *
     * @param {Track} track
     * @param {String} unit
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (track, unit, params) {

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Obus}
         * */
        this.errors = new Obus();

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Obus}
         * */
        this.result = new Obus();

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Object}
         * */
        this.params = Object(params);

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Track}
         * */
        this.track = track;

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {String}
         * */
        this.unit = unit;

        /**
         * @public
         * @memberOf {Context}
         * @property
         * @type {Logger}
         * */
        this.logger = this.track.logger.bind(this.unit);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @param {Array<String>} deps
     *
     * @returns {vow.Promise}
     * */
    append: function (deps) {
        deps = _.map(deps, this.__resolveAndSet, this);

        return vow.allResolved(deps);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @param {String} path
     * @param {*} [defaultValue]
     *
     * @returns {*}
     * */
    arg: function (path, defaultValue) {
        return Obus.get(this.params, path, defaultValue);
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {vow.Promise}
     * */
    execute: function () {
        var fullExecStartDate = new Date();
        var mainExecStartDate = fullExecStartDate;
        var defer = vow.defer();
        var unit = this.track.agent.getUnit(this.unit);

        this.logger.debug('Pending...');

        /** @this {Context} */
        defer.promise().then(function () {
            var date = new Date();
            this.logger.note('Accept in %dms (%dms)',
                date - fullExecStartDate,
                date - mainExecStartDate);
        }, function (data) {
            var date = new Date();
            this.logger.warn('Reject in %dms (%dms) %s',
                date - fullExecStartDate,
                date - mainExecStartDate,
                data, data);
        }, this);

        if (_.isUndefined(unit)) {
            this.logger.error('No such unit');
            defer.reject(new Control());

            return defer.promise();
        }

        if (!_.size(unit.deps)) {
            defer.resolve(unit.getValue(this));

            return defer.promise();
        }

        defer.resolve(this.append(unit.deps).then(function (promises) {
            mainExecStartDate = new Date();
            var promise = _.find(promises, function (promise) {
                //  Both rejects and accepts
                return promise.valueOf() instanceof Control;
            });

            //  No controls
            if (_.isUndefined(promise)) {

                return unit.getValue(this);
            }

            //  Has control
            return promise;
        }, this));

        return defer.promise();
    },

    /**
     * @public
     * @memberOf {Context}
     * @method
     *
     * @returns {Object}
     * */
    toJSON: function () {

        return {
            params: this.params,
            errors: this.errors,
            result: this.result
        };
    },

    /**
     * @private
     * @memberOf {Context}
     * @method
     *
     * @param {String} name
     *
     * @returns {vow.Promise}
     * */
    __resolveAndSet: function (name) {
        var promise = this.track.invoke(name);

        /** @this {Context} */
        promise.done(function (data) {
            Obus.set(this.result, name, data);
        }, function (data) {
            Obus.set(this.errors, name, data);
        }, this);

        return promise;
    }

});

module.exports = Context;
