'use strict';

var Task = /** @type Task */ require('fist.util.task/Task');
var extend = require('fist.lang.extend');

/**
 * @class Reader
 * @extends Task
 * */
var Reader = Task.extend(/** @lends Reader.prototype */ {

    /**
     * @protected
     * @memberOf {Reader}
     * @method
     *
     * @constructs
     *
     * @param {Object} readable
     * @param {*} [opts]
     * */
    constructor: function (readable, opts) {

        //  clone options
        opts = extend(true, Object.create(null), opts);

        opts.limit = +opts.limit;

        if ( isNaN(opts.limit) ) {
            opts.limit = Infinity;
        }

        opts.length = +opts.length;

        if ( isNaN(opts.length) ) {
            opts.length = Infinity;
        }

        Reader.Parent.call(this, this._parse, this, [opts]);

        /**
         * @protected
         * @memberOf {Reader}
         * @property {Object}
         * */
        this._readable = readable;
    },

    /**
     * @protected
     * @memberOf {Reader}
     * @method
     *
     * @param {*} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        done(null, new Buffer(0));
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Reader
     *
     * @method
     *
     * @returns {Error}
     * */
    ELIMIT: function (opts) {

        return extend(new Error(), {
            code: 'ELIMIT'
        }, opts);
    },

    /**
     * @public
     * @static
     * @memberOf Reader
     *
     * @method
     *
     * @returns {Error}
     * */
    ELENGTH: function (opts) {

        return extend(new Error(), {
            code: 'ELENGTH'
        }, opts);
    },

    /**
     * @public
     * @static
     * @memberOf Reader
     *
     * @method
     *
     * @returns {Boolean}
     * */
    isELIMIT: function (e) {

        return e instanceof Error && 'ELIMIT' === e.code;
    },

    /**
     * @public
     * @static
     * @memberOf Reader
     *
     * @method
     *
     * @returns {Boolean}
     * */
    isELENGTH: function (e) {

        return e instanceof Error && 'ELENGTH' === e.code;
    }

});

module.exports = Reader;
