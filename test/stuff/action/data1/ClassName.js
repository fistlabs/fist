'use strict';

var Component = /** @type Component */ require('../../../../Component');

/**
 * @class ClassName
 * @extends Component
 * */
var ClassName = Component.extend(/** @lends ClassName.prototype */ {

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
