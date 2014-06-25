'use strict';

var http = require('./http');
var Tracker = require('../../Framework');
var Connect = require('../../track/Connect');

module.exports = function (opts, handle, receive, trackerOpts) {
    var tracker = new Tracker(trackerOpts);
    http(opts, function (req, res) {
        var track = new Connect(tracker, req, res);
        handle.call(this, track, req, res);
    }, receive);
    return tracker;
};
