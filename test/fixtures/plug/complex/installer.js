'use strict';

var path = require('path');

module.exports = function (agent) {
    agent.INSTALLER = 42;
    agent.install(path.join(__dirname, '../*.js'));
};
