'use strict';

var Task = /** @type Task */ require('fist.util.task/Task');

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
        Reader.Parent.call(this, this._parse, this, [opts || {}]);

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

});

module.exports = Reader;
