'use strict';

module.exports = function (app) {
    app.route('GET /hello/(<name>/) s', 'hello_page');
};
