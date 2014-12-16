'use strict';

var path = require('path');

module.exports = function (app) {
    app.order.push('plug1');
    app.install(path.join(__dirname, 'subsub', 'sub.js'));
};
