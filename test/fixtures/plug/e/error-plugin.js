'use strict';

module.exports = function (done) {
    setTimeout(function () {
        done(42);
    }, 42);
};
