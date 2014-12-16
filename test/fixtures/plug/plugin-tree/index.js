'use strict';

var path = require('path');

module.exports = function (app) {
    var order = app.order = [];
    order.push(1);
    app.install(path.join(__dirname, 'subtree/plug1.js'));
    app.install(path.join(__dirname, 'subtree/plug2.js'));
};
