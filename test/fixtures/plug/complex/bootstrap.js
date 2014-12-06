'use strict';

var path = require('path');

module.exports = function (agent) {
    agent.BOOTSTRAP = 42;
    agent.install(path.join(__dirname, 'installer'));
};
