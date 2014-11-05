'use strict';

var Cache = require('../../core/cache/cache');

var inherit = require('inherit');

var AsyncCache = inherit(Cache, {

    broken: null,

    set: function (k, v, a, done) {
        if (this.broken) {
            done(this.broken);
        } else {
            this.__base(k, v, a, done);
        }
    },

    get: function (k, done) {
        if (this.broken) {
            done(this.broken);
        } else {
            this.__base(k, done);
        }
    }

});

module.exports = AsyncCache;
