'use strict';

var Cache = require('../../util/Cache');
var inherit = require('inherit');

var AsyncCache = inherit(Cache, {

    local: false,

    broken: null,

    set: function (k, v, a, done) {
        if ( this.broken ) {
            done(this.broken );
        } else {
            done(null, this.__base(k, v, a));
        }
    },

    get: function (k, done) {
        if ( this.broken ) {
            done(this.broken);
        } else {
            done(null, this.__base(k));
        }
    }

});

module.exports = AsyncCache;
