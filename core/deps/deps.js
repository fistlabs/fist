'use strict';

var Control = /** @type Control */ require('../control/control');
var Obus = /** @type Obus */ require('obus');

var _ = require('lodash-node');
var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Deps
 * */
var Deps = inherit(/** @lends Deps.prototype */ {

    /**
     * @protected
     * @memberOf {Deps}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {Object} [params]
     *
     * @constructs
     * */
    __constructor: function (track, path, params) {

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Obus}
         * */
        this.errors = new Obus();

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Obus}
         * */
        this.result = new Obus();

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Object}
         * */
        this.params = Object(params);

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Track}
         * */
        this.track = track;

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {String}
         * */
        this.unit = path;

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Date}
         * */
        this.date = new Date();
    },

    /**
     * @public
     * @memberOf {Deps}
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
     * @memberOf {Deps}
     * @method
     *
     * @param {String} path
     * @param {*} [defaultValue]
     *
     * @returns {*}
     * */
    arg: function (path, defaultValue) {
        return Obus.prototype.get.call(this.params, path, defaultValue);
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @returns {vow.Promise}
     * */
    execute: function () {
        var defer = vow.defer();
        var unit = this.track.agent.getUnit(this.unit);

        this.trigger('pending');

        /** @this {Deps} */
        defer.promise().then(function (data) {
            this.trigger('accept', data);
        }, function (data) {
            this.trigger('reject', data);
        }, this);

        if (_.isUndefined(unit)) {
            defer.reject(new Control());

            return defer.promise();
        }

        if (!_.size(unit.deps)) {
            defer.resolve(unit.getValue(this));

            return defer.promise();
        }

        defer.resolve(this.append(unit.deps).then(function (promises) {
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
     * @memberOf {Deps}
     * @method
     *
     * @param {String} event
     * @param {*} [data]
     * */
    trigger: function (event, data) {
        this.track.agent.channel('ctx').emit(event, {
            path: this.unit,
            data: data,
            time: new Date() - this.date,
            trackId: this.track.id
        });
    },

    /**
     * @public
     * @memberOf {Deps}
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
     * @memberOf {Deps}
     * @method
     *
     * @param {String} path
     *
     * @returns {vow.Promise}
     * */
    __resolveAndSet: function (path) {
        var promise = this.track.invoke(path);

        /** @this {Deps} */
        promise.done(function (data) {
            Obus.prototype.set.call(this.result, path, data);
        }, function (data) {
            Obus.prototype.set.call(this.errors, path, data);
        }, this);

        return promise;
    }

});

module.exports = Deps;
