'use strict';

var Activity = /** @type Activity */ require('fist.io.server/track/Activity');

/**
 * @class Runtime
 * @extends Activity
 * */
var Runtime = Activity.extend(/** @lends Runtime.prototype */ {

    /**
     * @public
     * @memberOf {Runtime}
     * @method
     *
     * @param {String} name
     * @param {Object} [params]
     *
     * @returns {String}
     * */
    buildUrl: function (name, params) {

        return this.agent.router.getRoute(name).build(params);
    }

});

module.exports = Runtime;
