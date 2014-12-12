'use strict';

//  Faster than Object.create
function F() {}

function create(proto) {
    F.prototype = proto;
    return new F();
}

module.exports = create;
