'use strict';

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
        this.ers = this.errors = {};

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Object}
         * */
        this.res = this.result = {};

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Object}
         * */
        this.params = params || {};

        /**
         * @public
         * @memberOf {Deps}
         * @property
         * @type {Track}
         * */
        this.track = track;

        /**
         * @private
         * @memberOf {Deps}
         * @property
         * @type {String}
         * */
        this.path = path;

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
     * @static
     * @memberOf Deps.prototype
     * @property
     * @type {Object}
     * */
    params: {},

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
     * @param {String} name
     *
     * @returns {*}
     * */
    arg: function (name) {

        return this.params[name];
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {String} path
     *
     * @returns {*}
     * */
    getRes: function (path) {

        return ns.use(this.res, path);
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {String} path
     *
     * @returns {*}
     * */
    getErr: function (path) {

        return ns.use(this.ers, path);
    },

    /**
     * @public
     * @memberOf {Deps}
     * @method
     *
     * @param {*} data
     * */
    notify: function (data) {

        return this.trigger('ctx:notify', data);
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
        this.track.agent.emit(event, {
            path: this.path,
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

        return ns.add(this.res, path, data);
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

        return ns.add(this.ers, path, data);
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
        var promise = this.track.invoke(path, this.params);

        promise.done(function (data) {
            this.setRes(path, data);
        }, function (data) {
            this.setErr(path, data);
        }, this);

        return promise;
    }

});

module.exports = Deps;
