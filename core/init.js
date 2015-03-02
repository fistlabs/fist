'use strict';

var LRUDictTtlAsync = /** @type LRUDictTtlAsync */ require('lru-dict/core/lru-dict-ttl-async');
var Unit = /** @type Unit */ require('./unit');

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
    app.caches.local = new LRUDictTtlAsync(0xffff);

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
