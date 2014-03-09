'use strict';

var http = require('./http');
var Server = require('../../Server');
var Connect = require('../../track/Connect');

module.exports = function (opts, handle, receive) {
    return http(opts, function (req, res) {
        var tracker = new Server();
        var track = new Connect(tracker, req, res);
        handle.call(this, track, req, res);
    }, receive);
};
