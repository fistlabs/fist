'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');

/**
 * @class Toobusy
 * @extends Class
 * */
var Toobusy = Class.extend({

    /**
     * @protected
     * @memberOf {Toobusy}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Toobusy.Parent.apply(this, arguments);

        var intervalObj;

        /**
         * @public
         * @memberOf {Toobusy}
         * @property
         * @type {Number}
         * */
        this.lag = 0;

        /**
         * @protected
         * @memberOf {Toobusy}
         * @property
         * @type {Number}
         * */
        this._time = Date.now();

        if ( 'number' !== typeof this.params.maxLag ) {
            this.params.maxLag = Toobusy.HIGH_WATER_MARK;
        }

    //  процесс не будет ждать этого таймера, а нормально закроется
        intervalObj = setInterval(this._check.bind(this),
            Toobusy.CHECK_INTERVAL);

        if ( 'function' === typeof intervalObj.unref ) {
            intervalObj.unref();
        }
    },

    /**
     * @public
     * @memberOf {Toobusy}
     * @method
     *
     * @returns {Boolean}
     * */
    busy: function () {

        return Math.random() <
            (this.lag - this.params.maxLag) / this.params.maxLag;
    },

    /**
     * @protected
     * @memberOf {Toobusy}
     * @method
     * */
    _check: function () {

        var now = Date.now();
        var lag = now - this._time;

        if ( lag < Toobusy.CHECK_INTERVAL ) {
            lag = 0;
        } else {
            lag -= Toobusy.CHECK_INTERVAL;
        }

        this.lag = (lag + this.lag * 2) / 3;

        this._time = now;
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Toobusy
     * @property {Number}
     * */
    HIGH_WATER_MARK: 70,

    /**
     * @public
     * @static
     * @memberOf Toobusy
     * @property {Number}
     * */
    CHECK_INTERVAL: 500
});

module.exports = Toobusy;
