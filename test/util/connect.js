'use strict';

var Connect = require('../../core/track/connect');
var Server = require('../../core/server');

var http = require('./http');

module.exports = function (opts, handle, receive, trackerOpts) {
    var tracker = new Server(trackerOpts);
    http(opts, function (req, res) {
        var track = new Connect(tracker, null, req, res);
        handle.call(this, track, req, res);
    }).done(function (res) {
        receive(null, res);
    }, receive);
    return tracker;
};
