'use strict';

module.exports = function (done) {
    var self = this;

    setTimeout(function () {
        self.async = 42;
        done();
    }, 42);
};
