'use strict';

module.exports = function (settings) {

    return function (agent, done) {
        agent.settings = settings;

        setTimeout(function () {
            done();
        }, 0);
    };
};
