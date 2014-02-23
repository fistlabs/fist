'use strict';

var Component = /** @type Component */ require('fist.util.component/Component');

/**
 * @class Action
 * @extends Component
 * */
var Action = Component.extend(/** @lends Action.prototype */ {

    /**
     * @public
     * @memberOf {Action}
     * @property {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Action}
     * @method
     *
     * @param {Activity} track
     * @param {Object} result
     * @param {Function} done
     * */
    data: function (track, result, done) {
        done(null, this.params);
    }

});

module.exports = Action;
