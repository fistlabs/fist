// TODO make errors subclasses of FistError
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

/**
 * @class BadUnitError
 * @extends FistError
 *
 * @param {String} msg
 * */
function BadUnitError(msg) {
    FistError.call(this, 'BAD_UNIT', msg);
}

BadUnitError.prototype = Object.create(FistError.prototype);

/**
 * @public
 * @memberOf {BadUnitError}
 * @method
 *
 * @constructs
 * */
BadUnitError.prototype.constructor = BadUnitError;

/**
 * @public
 * @memberOf {BadUnitError}
 * @property
 * @type {String}
 * */
BadUnitError.prototype.name = 'BadUnitError';

/**
 * @class NoSuchUnitError
 * @extends FistError
 *
 * @param {String} msg
 * */
function NoSuchUnitError(msg) {
    FistError.call(this, 'NO_SUCH_UNIT', msg);
}

NoSuchUnitError.prototype = Object.create(FistError.prototype);

/**
 * @public
 * @memberOf {NoSuchUnitError}
 * @method
 *
 * @constructs
 * */
NoSuchUnitError.prototype.constructor = NoSuchUnitError;

/**
 * @public
 * @memberOf {NoSuchUnitError}
 * @property
 * @type {String}
 * */
NoSuchUnitError.prototype.name = 'NoSuchUnitError';

/**
 * @class DepsConflictError
 * @extends FistError
 *
 * @param {String} msg
 * */
function DepsConflictError(msg) {
    FistError.call(this, 'DEPS_CONFLICT', msg);
}

DepsConflictError.prototype = Object.create(FistError.prototype);

/**
 * @public
 * @memberOf {BadUnitError}
 * @method
 *
 * @constructs
 * */
DepsConflictError.prototype.constructor = DepsConflictError;

/**
 * @public
 * @memberOf {DepsConflictError}
 * @property
 * @type {String}
 * */
DepsConflictError.prototype.name = 'DepsConflictError';

/**
 * @class NoSuchCache
 * @extends FistError
 *
 * @param {String} msg
 * */
function NoSuchCacheError(msg) {
    FistError.call(this, 'NO_SUCH_CACHE', msg);
}

NoSuchCacheError.prototype = Object.create(FistError.prototype);

/**
 * @public
 * @memberOf {NoSuchCacheError}
 * @method
 * @constructs
 * */
NoSuchCacheError.prototype.constructor = NoSuchCacheError;

/**
 * @public
 * @memberOf {NoSuchCacheError}
 * @property
 * @type {String}
 * */
NoSuchCacheError.prototype.name = 'NoSuchCacheError';

exports.FistError = FistError;

exports.BadUnitError = BadUnitError;

exports.NoSuchUnitError = NoSuchUnitError;

exports.DepsConflictError = DepsConflictError;

exports.NoSuchCacheError = NoSuchCacheError;

Object.freeze(exports);
