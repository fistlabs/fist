'use strict';

var _ = require('lodash-node');
var inherit = require('inherit');
var util = require('util');

/**
 * @class BaseConflictError
 * @extends ReferenceError
 * */
var BaseConflictError = inherit(ReferenceError, {

    /**
     * @private
     * @memberOf {BaseConflictError}
     * @method
     *
     * @param {Object} decls
     *
     * @constructs
     * */
    __constructor: function (decls) {
        var msg = BaseConflictError.__formatConflictsDetails(decls);
        var err = new ReferenceError(msg);

        err.name = this.name;

        Error.captureStackTrace(err, BaseConflictError);

        /**
         * @public
         * @memberOf {BaseConflictError}
         * @property
         * @type {String}
         * */
        this.message = err.message;

        /**
         * @public
         * @memberOf {BaseConflictError}
         * @property
         * @type {String}
         * */
        this.stack = err.stack;
    },

    /**
     * @public
     * @memberOf {BaseConflictError}
     * @property
     * @type {String}
     * */
    name: 'BaseConflictError'

}, {

    /**
     * @private
     * @static
     * @memberOf BaseConflictError
     * @method
     *
     * @param {Object} decls
     *
     * @returns {String}
     * */
    __formatConflictsDetails: function (decls) {
        var details = _.map(decls, BaseConflictError.__formatConflictDetails);

        details = details.join(', ');

        return util.format('no base unit for: %s', details);
    },

    /**
     * @private
     * @static
     * @memberOf BaseConflictError
     * @method
     *
     * @param {Object} decl
     *
     * @returns {String}
     * */
    __formatConflictDetails: function (decl) {
        var members = decl.members;

        return util.format('%s (requires %s)', members.name, members.base);
    }

});

module.exports = BaseConflictError;
