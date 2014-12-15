'use strict';

var f = require('util').format;

/**
 * @class FistError
 * @extends Error
 *
 * @param {String} code
 * @param {String} msg
 * */
function FistError(code, msg) {
    var err = new Error(f('(%s) %s', code, msg));

    err.name = this.name;

    Error.captureStackTrace(err, this.constructor);

    /**
     * @public
     * @memberOf {FistError}
     * @property
     * @type {String}
     * */
    this.code = code;

    /**
     * @public
     * @memberOf {FistError}
     * @property
     * @type {String}
     * */
    this.message = err.message;

    /**
     * @public
     * @memberOf {FistError}
     * @property
     * @type {String}
     * */
    this.stack = err.stack;
}

/**
 * @public
 * @static
 * @final
 * @memberOf {FistError}
 * @property
 * @type {String}
 * */
FistError.UNKNOWN = 'UNKNOWN';

/**
 * @public
 * @static
 * @final
 * @memberOf {FistError}
 * @property
 * @type {String}
 * */
FistError.BAD_UNIT = 'BAD_UNIT';

/**
 * @public
 * @static
 * @final
 * @memberOf {FistError}
 * @property
 * @type {String}
 * */
FistError.DEPS_CONFLICT = 'DEPS_CONFLICT';

/**
 * @public
 * @static
 * @final
 * @memberOf {FistError}
 * @property
 * @type {String}
 * */
FistError.NO_SUCH_UNIT = 'NO_SUCH_UNIT';

FistError.prototype = Object.create(Error.prototype);

/**
 * @public
 * @memberOf {FistError}
 * @method
 *
 * @constructs
 * */
FistError.prototype.constructor = FistError;

/**
 * @public
 * @memberOf {FistError}
 * @property
 * @type {String}
 * */
FistError.prototype.name = 'FistError';

module.exports = FistError;
