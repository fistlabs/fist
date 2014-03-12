'use strict';

var forEach = require('fist.lang.foreach');
var toArray = require('fist.lang.toarray');

module.exports = function (done) {
    //  Роуты из параметров добавляются при инстанцировании
    forEach(toArray(this.params.routes), function (desc) {
        this.route(desc.verb, desc.expr, desc.name, desc.data, desc.opts);
    }, this);

    done(null, null);
};
