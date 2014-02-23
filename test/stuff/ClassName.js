'use strict';

var Action = /** @type Action */ require('../../Action');

/**
 * @class ClassName
 * @extends Action
 * */
var ClassName = Action.extend(/** @lends ClassName.prototype */ {

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
