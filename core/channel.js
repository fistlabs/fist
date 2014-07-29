'use strict';

var EventEmitter = require('events').EventEmitter;

var _ = require('lodash-node');
var inherit = require('inherit');

/**
 * @class Channel
 * @extends EventEmitter
 * */
var Channel = inherit(EventEmitter, /** @lends Channel.prototype */ {

    /**
     * @private
     * @memberOf {Channel}
     * @method
     *
     * @constructs
     * */
    __constructor: function () {
        this.__base();

        /**
         * @private
         * @memberOf {Channel}
         * @property
         * @type {Object}
         * */
        this.__channels = {};
    },

    /**
     * Как обычный emit, но исключения в обработчиках вылетают асинхронно
     *
     * @public
     * @memberOf {Channel}
     * @method
     * */
    emit: function () {

        try {

            return this.__base.apply(this, arguments);

        } catch (err) {
            process.nextTick(function () {

                throw err;
            });
        }
    },

    /**
     * @public
     * @memberOf {Channel}
     * @method
     *
     * @param {String} [name]
     *
     * @returns {Channel}
     * */
    channel: function (name) {

        if ( !_.has(this.__channels, name) ) {
            this.__channels[name] = new Channel();
        }

        return this.__channels[name];
    }

});

module.exports = Channel;
