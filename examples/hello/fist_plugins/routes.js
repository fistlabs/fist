'use strict';

module.exports = function (app) {
    app.route('GET /hello/(<name>/)', 'hello_page');
};
