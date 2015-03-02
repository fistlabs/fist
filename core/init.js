'use strict';

var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('lru-dict/core/lru-dict-ttl-async');
var Unit = /** @type Unit */ require('./unit');

var inherit = require('inherit');

function init(app) {

    /**
     * @public
     * @memberOf app
     * @property
     * @type {Object}
     * */
    app.caches = {

        /**
         * default cache interface "local"
         *
         * @public
         * @memberOf app.caches
         * @property
         * @type {LRUDictTtlAsync}
         * */
        local: new LRUDictTtlAsync(0xffff)
    };

    /**
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
            this.__base(app);
        }

    });
}

module.exports = init;
