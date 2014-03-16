'use strict';

var http = require('./http');
var Tracker = require('../../Tracker');
var Connect = require('../../track/Connect');

module.exports = function (opts, handle, receive) {
    return http(opts, function (req, res) {
        var tracker = new Tracker();
        var track = new Connect(tracker, req, res);
        handle.call(this, track, req, res);
    }, receive);
};
