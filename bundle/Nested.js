'use strict';

var Bundle = /** @type Bundle */ require('./Bundle');
var Namespace = /** @type Namespace */ require('fist.util.namespace/Namespace');

var extend = require('fist.lang.extend');

/**
 * @class Nested
 * @extends Bundle
 * */
var Nested = Bundle.extend(/** @lends Nested.prototype */ {

    /**
     * @protected
     * @memberOf {Nested}
     * @method
     *
     * @param {Object} root
     * @param {String} path
     * @param {*} data
     * */
    _link: function (root, path, data) {

        var nmsp = Namespace.useOn(root, path);

        if ( Object(nmsp) === nmsp ) {
            extend(nmsp, data);

            return;
        }

        Namespace.linkOn(root, path, data);
    }

});

module.exports = Nested;
