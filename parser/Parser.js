'use strict';

var Class = /** @type Class */ require('fist.lang.class/Class');

var extend = require('fist.lang.extend');
var once = require('../util/once');

/**
 * @abstract
 * @class Parser
 * @extends Class
 * */
var Parser = Class.extend(/** @lends Parser.prototype */ {

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @constructs
     *
     * @param {Object} stream
     * @param {*} [params]
     * */
    constructor: function (stream, params) {
        Parser.Parent.call(this, params);

        params = this.params;

        params.limit = +params.limit;

        if ( isNaN(params.limit) ) {
            params.limit = Infinity;
        }

        params.length = +params.length;

        if ( isNaN(params.length) ) {
            params.length = Infinity;
        }

        /**
         * @protected
         * @memberOf {Parser}
         * @property
         * @type {Function}
         * */
        this._done = once(function (done) {

            var self = this;

            this._parse(function (err, res) {
                if ( 2 > arguments.length ) {
                    done(err);
                    return;
                }

                done(null, self._template(res));
            });

        }.bind(this));

        /**
         * @protected
         * @memberOf {Parser}
         * @property {Object}
         * */
        this._stream = stream;
    },

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @param {Function} done
     * */
    _parse: function (done) {
        done(null, Object.create(null));
    },

    /**
     * @public
     * @memberOf {Loader}
     * @property
     * */
    type: void 0,

    /**
     * @protected
     * @memberOf {Parser}
     * @method
     *
     * @param {*} res
     *
     * @returns {Object}
     * */
    _template: function (res) {

        return {
            input: res,
            type: this.type
        };
    },

    /**
     * @public
     * @memberOf {Parser}
     * @method
     *
     * @param {Function} done
     * @param {*} [ctxt]
     * */
    parse: function (done, ctxt) {
        this._done(done, ctxt);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Parser
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
     * @memberOf Parser
     *
     * @method
     *
     * @returns {Error}
     * */
    ELENGTH: function (opts) {

        return extend(new Error(), {
            code: 'ELENGTH'
        }, opts);
    }

});

module.exports = Parser;
