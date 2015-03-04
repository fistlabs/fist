// TODO Should it be inlined in Core?
'use strict';

var FistError = /** @type FistError */ require('./fist-error');
var Unit = /** @type Unit */ require('./unit');

var _ = require('lodash-node');
var f = require('util').format;
var inherit = require('inherit');

function init(app) {

    /**
     * default cache interface "local"
     *
     * @public
     * @memberOf app.caches
     * @property
     * @type {LRUDictTtlAsync}
     * */
    app.caches.local = Unit.prototype.cache;

    /**
     * @public
     * @memberOf {Core}
     * @property
     * @class app.Unit
     * @extends Unit
     * */
    app.Unit = inherit(Unit, /** @lends app.Unit.prototype */ {

        /**
         * @private
         * @memberOf {app.Unit}
         * @method
         *
         * @constructs
         * */
        __constructor: function () {
            // Close `app` in constructor to allow to do not `this.__base(app)` in subclasses
            this.__base(app);

            /**
             * @public
             * @memberOf {app.Unit}
             * @property
             * @type {Object}
             * */
            this.cache = this.createCache();
        },

        /**
         * @public
         * @memberOf {app.Unit}
         * @method
         *
         * @returns {Object}
         * @throw {FistError}
         * */
        createCache: function () {
            if (_.isObject(this.cache)) {
                return this.cache;
            }

            if (!_.has(this.app.caches, this.cache)) {
                throw new FistError('UNKNOWN_CACHE', f('You should define app.caches[%j] interface', this.cache));
            }

            return this.app.caches[this.cache];
        }

    });
}

module.exports = init;
