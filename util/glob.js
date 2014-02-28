'use strict';

var glob = require('glob');

module.exports = function (expr, done) {

    try {
        glob(expr, done.bind(this));

    } catch (err) {
        done.call(this, err);
    }
};
