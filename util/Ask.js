'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');
var Next = /** @type Next */ require('fist.util.next/Next');

var uniqueId = require('fist.lang.id');

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

        this._next = this._next.
            next(function (res, done) {

                if ( this._solved() ) {

                    return;
                }

                done(null, res);
            }, function (err, done) {

                if ( this._solved() ) {

                    return;
                }

                done(err);
            }, this).
            next(done, fail, ctxt);

        return this;
    }

});

module.exports = Ask;
