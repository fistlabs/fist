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
     * @param {Array} paths
     *
     * @constructs
     * */
    __constructor: function (paths) {
        var msg = DepsConflictError.__formatConflictsDetails(paths);
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
     * @param {Array} paths
     *
     * @returns {String}
     * */
    __formatConflictsDetails: function (paths) {
        var details = _.map(paths, DepsConflictError.__formatConflictDetails);

        details = details.join(', ');

        return util.format('unit dependencies conflict: %s', details);
    },

    /**
     * @private
     * @static
     * @memberOf DepsConflictError
     * @method
     *
     * @param {Array} path
     *
     * @returns {String}
     * */
    __formatConflictDetails: function (path) {

        return path.join(' < ');
    }

});

module.exports = DepsConflictError;
