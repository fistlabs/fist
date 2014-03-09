'use strict';

var Task = /** @type Task */ require('fist.util.task/Task');

/**
 * @class Loader
 * @extends Task
 * */
var Loader = Task.extend(/** @lends Loader.prototype */ {

    /**
     * @protected
     * @memberOf {Loader}
     * @method
     *
     * @constructs
     *
     * @param {Object} readable
     * @param {*} [opts]
     * */
    constructor: function (readable, opts) {
        Loader.Parent.call(this, this._parse, this, [opts || {}]);

        /**
         * @protected
         * @memberOf {Loader}
         * @property {Object}
         * */
        this._readable = readable;
    },

    /**
     * @protected
     * @memberOf {Loader}
     * @method
     *
     * @param {*} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        done(null, new Buffer(0));
    }

});

module.exports = Loader;
