'use strict';

var i = 0;

module.exports = function (agent) {
    agent.__test__ = i += 1;
};
