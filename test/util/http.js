'use strict';

var Fs = require('fs');
var Http = require('http');
var vowAsker = require('vow-asker');
var sock = require('./sock');

module.exports = function (params, handle) {
    var promise;
    var server;

    try {
        Fs.unlinkSync(sock);
    } catch (e) {}

    server = Http.createServer(handle).listen(sock);

    params.socketPath = sock;

    params.statusFilter = function filter () {

        return {
            accept: true,
            isRetryAllowed: false
        };
    };

    promise = vowAsker(params).then(function (res) {

        if ( null === res.data ) {
            res.data = new Buffer(0);
        }

        return res;
    });

    promise.always(function () {
        server.close();
    });

    return promise;
};
