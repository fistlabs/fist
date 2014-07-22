'use strict';

var http = require('./http');
var Server = require('../../core/server');
var Connect = require('../../core/track/connect');

module.exports = function (opts, handle, receive, trackerOpts) {
    var tracker = new Server(trackerOpts);
    http(opts, function (req, res) {
        var track = new Connect(tracker, req, res);
        handle.call(this, track, req, res);
    }, receive);
    return tracker;
};
