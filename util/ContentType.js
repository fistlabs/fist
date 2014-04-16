'use strict';

var MediaHead = /** @type MediaHead */ require('./MediaHead');

var _ = /** @type _ */ require('lodash');

/**
 * @class ContentType
 * @extends MediaHead
 * */
var ContentType = MediaHead.extend(/** @lends ContentType.prototype */ {

    /**
     * @protected
     * @memberOf {ContentType}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        ContentType.Parent.apply(this, arguments);

        var type;

        /**
         * @public
         * @memberOf {ContentType}
         * @property
         * @type {String}
         * */
        this.type = void 0;

        /**
         * @public
         * @memberOf {ContentType}
         * @property
         * @type {String}
         * */
        this.subtype = void 0;

        if ( this.value ) {
            type = this.value.split('/');

            this.type = type.shift();

            if ( type.length ) {
                this.subtype = type.join('/');
            }
        }
    },

    /**
     * @public
     * @memberOf {ContentType}
     * @method
     *
     * @returns {String}
     * */
    getMime: function () {

        return this.value;
    }

});

module.exports = ContentType;
