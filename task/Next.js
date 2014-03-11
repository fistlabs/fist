'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');

/**
 * @class Next
 * @extends Base
 * */
var Next = Base.extend(/** @lends Next.prototype */ {

    /**
     * @protected
     * @memberOf {Next}
     * @method
     *
     * @constructs
     * */
    constructor: function () {

        /**
         * @private
         * @memberOf {Next}
         * @property {Array}
         * */
        this.__dones__ = [];

        /**
         * @private
         * @memberOf {Next}
         * @property {Array}
         * */
        this.__fails__ = [];

        /**
         * @private
         * @memberOf {Next}
         * @property {Number}
         * */
        this.__state__ = -1;

        /**
         * @private
         * @memberOf {Next}
         * @property {Array}
         * */
        this.__value__ = [];
    },

    /**
     * @public
     * @memberOf {Next}
     * @method
     *
     * @param {Array|Arguments} [args]
     * */
    args: function (args) {
        this.resolve.apply(this, args);
    },

    /**
     * @public
     * @memberOf {Next}
     * @method
     *
     * @param {Function} [done]
     * @param {*} [ctxt]
     * */
    done: function (done, ctxt) {
        this.next(function (res) {
            done.call(this, null, res);
        }, function (err) {
            done.call(this, err);
        }, ctxt);
    },

    /**
     * @public
     * @memberOf {Next}
     * @method
     *
     * @param {*} [done]
     * @param {*} [fail]
     * @param {*} [ctxt]
     *
     * @returns {Next}
     * */
    next: function (done, fail, ctxt) {

        var next = new Next();

        if ( 'function' !== typeof fail ) {
            ctxt = fail;
        }

        if ( -1 === this.__state__) {
            this.__dones__.push({
                func: done,
                ctxt: ctxt,
                next: next
            });

            this.__fails__.push({
                func: fail,
                ctxt: ctxt,
                next: next
            });

            return next;
        }

        this.__call__([
            {
                func: arguments[this.__state__],
                ctxt: ctxt,
                next: next
            }
        ], this.__value__, this.__state__);

        return next;
    },

    /**
     * @public
     * @memberOf {Next}
     * @method
     * */
    resolve: function () {

        if ( -1 === this.__state__ ) {
            this.__value__ = arguments;
            this.__state__ = +( 2 > arguments.length );
            this.__call__([this.__dones__, this.__fails__]
                [this.__state__], this.__value__, this.__state__);
        }
    },

    /**
     * @private
     * @memberOf {Next}
     * @method
     *
     * @param {Array} funcs
     * @param {Array} args
     * @param {Number} state
     * */
    __call__: function (funcs, args, state) {

        var i;
        var l;

        for ( i = 0, l = funcs.length; i < l; i += 1 ) {
            this.__func__(funcs[i], args, state);
        }

        this.__dones__ = [];
        this.__fails__ = [];
    },

    /**
     * @private
     * @memberOf {Next}
     * @method
     *
     * @param {Object} func
     * @param {Array} args
     * @param {Number} state
     * */
    __func__: function (func, args, state) {

        if ( 'function' === typeof func.func ) {
            func.func.call(func.ctxt, args[1 - state], function () {
                func.next.args(arguments);
            });

            return;
        }

        func.next.args(args);
    }

});

module.exports = Next;
