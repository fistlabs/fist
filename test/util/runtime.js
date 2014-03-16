'use strict';

var http = require('./http');
var Tracker = require('../../Tracker');
var Runtime = require('../../track/Runtime');

module.exports = function (opts, handle, receive) {
    return http(opts, function (req, res) {
        var tracker = new Tracker();
        var track = new Runtime(tracker, req, res);
        handle.call(this, track, req, res);
    }, receive);
};
