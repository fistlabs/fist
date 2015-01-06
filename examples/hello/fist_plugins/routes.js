'use strict';

module.exports = function (app) {
    // assign request rule with 'hello' controller
    app.route('GET /hello/(<name>/)', 'hello');
};
