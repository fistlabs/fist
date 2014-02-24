'use strict';

var Component = /** @type Component */ require('fist.util.component/Component');

/**
 * @class Knot
 * @extends Component
 * */
var Knot = Component.extend(/** @lends Knot.prototype */ {

    /**
     * @public
     * @memberOf {Knot}
     * @property {Array<String>}
     * */
    deps: [],

    /**
     * @public
     * @memberOf {Knot}
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

module.exports = Knot;
