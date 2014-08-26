'use strict';

var Control = /** @type Control */ require('../control/control');

var _ = require('lodash-node');
var inherit = require('inherit');
var ns = require('../util/ns');
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
         * @type {Object}
         * */
        this.errors = {};

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Object}
         * */
        this.result = {};

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
         * @private
         * @memberOf {Deps}
         * @property
         * @type {Date}
         * */
        this.__creationDate = new Date();
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
        var result = ns.use(this.args(), path);

        if ( this._isFalsy(result) ) {
            result = defaultValue;
        }

        return result;
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @returns {*}
     * */
    args: function () {

        if ( !this.__args ) {
            this.__args  = this._dumpArgs();
        }

        return this.__args;
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {String} [path]
     * @param {*} [defaultValue]
     *
     * @returns {*}
     * */
    getRes: function (path, defaultValue) {
        /*eslint no-unused-vars: 0*/
        return this.__get(this.result, arguments);
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {String} [path]
     * @param {*} [defaultValue]
     *
     * @returns {*}
     * */
    getErr: function (path, defaultValue) {
        /*eslint no-unused-vars: 0*/
        return this.__get(this.errors, arguments);
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

        defer.promise().then(function (data) {
            this.trigger('accept', data);
        }, function (data) {
            this.trigger('reject', data);
        }, this);

        if ( _.isUndefined(unit) ) {
            defer.reject();

            return defer.promise();
        }

        if ( 0 === _.size(unit.deps) ) {
            defer.resolve(unit.getValue(this));

            return defer.promise();
        }

        defer.resolve(this.append(unit.deps).then(function (promises) {
            var promise = _.find(promises, function (promise) {

                return promise.valueOf() instanceof Control;
            });

            if ( _.isUndefined(promise) ) {

                return unit.getValue(this);
            }

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
            time: new Date() - this.__creationDate,
            trackId: this.track.id
        });
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {String} path
     * @param {*} data
     * */
    setRes: function (path, data) {

        return ns.add(this.result, path, data);
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {String} path
     * @param {*} data
     * */
    setErr: function (path, data) {

        return ns.add(this.errors, path, data);
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
            params: this.args(),
            errors: this.getErr(),
            result: this.getRes()
        };
    },

    /**
     * @protected
     * @memberOf {Deps}
     * @method
     *
     * @returns {Object}
     * */
    _dumpArgs: function () {

        return this.params;
    },

    /**
     * @protected
     * @memberOf {Deps}
     * @method
     *
     * @param {*} v
     *
     * @returns {Boolean}
     * */
    _isFalsy: function (v) {

        return _.isUndefined(v) || _.isNull(v) || '' === v;
    },

    /**
     * @private
     * @memberOf {Deps}
     * @method
     *
     * @param {*} root
     * @param {Arguments} args
     *
     * @returns {*}
     * */
    __get: function (root, args) {
        var result;

        if ( 0 === args.length ) {

            return root;
        }

        result = ns.use(root, args[0]);

        if ( this._isFalsy(result) ) {
            result = args[1];
        }

        return result;
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

        promise.done(function (data) {
            this.setRes(path, data);
        }, function (data) {
            this.setErr(path, data);
        }, this);

        return promise;
    }

});

module.exports = Deps;
