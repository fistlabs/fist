'use strict';

var Fs = require('fs');
var Http = require('http');
var vowAsker = require('vow-asker');
var sock = require('./sock');

module.exports = function (params, handle) {

    try {
        Fs.unlinkSync(sock);
    } catch (e) {}

    Http.createServer(handle).listen(sock);

    params.socketPath = sock;

    params.statusFilter = function filter () {

        return {
            accept: true,
            isRetryAllowed: false
        };
    };

    return vowAsker(params).then(function (res) {

        if ( null === res.data ) {
            res.data = new Buffer(0);
        }

        return res;
    });
};
