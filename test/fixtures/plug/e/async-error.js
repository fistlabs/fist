'use strict';

module.exports = function (app, done) {
    setTimeout(function () {
        done('ASYNC');
    }, 10);
};
