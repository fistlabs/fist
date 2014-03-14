'use strict';

var Base = require('fist.lang.class/Base');
var Next = /** @type Next */ require('../task/Next');

var uniqueId = require('fist.util.id');

/**
 * @class Ask
 * @extends Base
 * */
var Ask = Base.extend(/** @lends Ask.prototype */ {

    /**
     * @protected
     * @memberOf {Ask}
     * @method
     *
     * @constructs
     *
     * @param {Connect} track
     * @param {Object} errors
     * @param {Object} result
     * @param {Function} done
     * */
    constructor: function (track, errors, result, done) {

        var next = new Next();

        next.args([null, {}]);

        /**
         * @protected
         * @memberOf {Ask}
         * @property
         * @type {Next}
         * */
        this._next = next;

        /**
         * @public
         * @memberOf {Ask}
         * @property
         * @type {String}
         * */
        this.name = uniqueId();

        /**
         * @public
         * @memberOf {Ask}
         * @property
         * @type {Connect}
         * */
        this.track = track;

        /**
         * @public
         * @memberOf {Ask}
         * @property
         * @type {Object}
         * */
        this.errors = errors;

        /**
         * @public
         * @memberOf {Ask}
         * @property
         * @type {Object}
         * */
        this.result = result;

        /**
         * @protected
         * @memberOf {Ask}
         * @property
         * @type {Boolean}
         * */
        this._occurs = false;

        /**
         * @public
         * @memberOf {Ask}
         * @method
         * */
        this.done = function () {
            this._occurs = true;
            done.apply(this, arguments);
        };
    },

    /**
     * @protected
     * @memberOf {Ask}
     * @method
     *
     * @returns {Boolean}
     * */
    _solved: function () {

        return this._occurs || this.track.sent();
    },

    /**
     * @public
     * @memberOf {Ask}
     * @method
     *
     * @returns {Ask}
     * */
    next: function (done, fail, ctxt) {

        if ( this._solved() ) {

            return this;
        }

        if ( 'function' !== typeof fail ) {
            ctxt = fail;
        }

        this._next = this._next.next(function (res, ok) {

            if ( this._solved() ) {
                return;
            }

            if ( 'function' === typeof done ) {
                done.apply(ctxt, arguments);

                return;
            }

            ok.call(ctxt, null, res);

        }, function (err, ok) {

            if ( this._solved() ) {

                return;
            }

            if ( 'function' === typeof fail ) {
                fail.apply(ctxt, arguments);

                return;
            }

            ok.call(ctxt, err);
        }, this);

        return this;
    }

});

module.exports = Ask;
