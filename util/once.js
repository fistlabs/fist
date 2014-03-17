'use strict';

var Next = /** @type Next */ require('fist.util.next/Next');

module.exports = function (fn) {

    var next = null;

    return function (done, ctxt) {

        if ( null === next ) {
            next = new Next();

            fn(function () {
                next.args(arguments);
            });
        }

        next.done(done, ctxt);
    };
};
