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
     * @param {Boolean} [only]
     *
     * @returns {String|void}
     * */
    arg: function (name, only) {

        var result = this.match[name];

        if ( only ) {

            return result;
        }

        return result || this.url.query[name];
    },

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
    buildPath: function (name, params) {

        return this.agent.router.getRoute(name).build(params);
    }

});

module.exports = Runtime;
