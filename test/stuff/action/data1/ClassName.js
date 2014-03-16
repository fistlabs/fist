'use strict';

var Unit = /** @type Unit */ require('fist.unit/Unit');

/**
 * @class ClassName
 * @extends Unit
 * */
var ClassName = Unit.extend(/** @lends ClassName.prototype */ {

    deps: ['abbr'],

    /**
     * @public
     * @memberOf {ClassName}
     * @method
     * */
    data: function (track, errors, result, done) {
        done(null, 'by-stuff');
    }

});

module.exports = ClassName;
