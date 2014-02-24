'use strict';

var Knot = /** @type Knot */ require('../../Knot');

/**
 * @class ClassName
 * @extends Knot
 * */
var ClassName = Knot.extend(/** @lends ClassName.prototype */ {

    deps: ['abbr'],

    /**
     * @public
     * @memberOf {ClassName}
     * @method
     * */
    data: function (track, result, done) {
        done(null, 'by-stuff');
    }

});

module.exports = ClassName;
