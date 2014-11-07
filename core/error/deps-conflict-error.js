'use strict';

var _ = require('lodash-node');
var inherit = require('inherit');
var util = require('util');

/**
 * @class DepsConflictError
 * @extends ReferenceError
 * */
var DepsConflictError = inherit(ReferenceError, {

    /**
     * @private
     * @memberOf {DepsConflictError}
     * @method
     *
     * @param {Array} names
     *
     * @constructs
     * */
    __constructor: function (names) {
        var msg = DepsConflictError.__formatConflictsDetails(names);
        var err = new ReferenceError(msg);

        err.name = this.name;

        Error.captureStackTrace(err, DepsConflictError);

        /**
         * @public
         * @memberOf {DepsConflictError}
         * @property
         * @type {String}
         * */
        this.message = err.message;

        /**
         * @public
         * @memberOf {DepsConflictError}
         * @property
         * @type {String}
         * */
        this.stack = err.stack;
    },

    /**
     * @public
     * @memberOf {DepsConflictError}
     * @property
     * @type {String}
     * */
    name: 'DepsConflictError'

}, {

    /**
     * @private
     * @static
     * @memberOf DepsConflictError
     * @method
     *
     * @param {Array} names
     *
     * @returns {String}
     * */
    __formatConflictsDetails: function (names) {
        var details = _.map(names, DepsConflictError.__formatConflictDetails);

        details = details.join(', ');

        return util.format('unit dependencies conflict: %s', details);
    },

    /**
     * @private
     * @static
     * @memberOf DepsConflictError
     * @method
     *
     * @param {Array} name
     *
     * @returns {String}
     * */
    __formatConflictDetails: function (name) {

        return name.join(' < ');
    }

});

module.exports = DepsConflictError;
