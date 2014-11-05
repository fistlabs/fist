'use strict';

var fs = require('fs');
var http = require('http');
var sock = require('./sock');
var vowAsker = require('vow-asker');

module.exports = function (params, handle) {
    var promise;
    var server;

    try {
        fs.unlinkSync(sock);
    } catch (e) {}

    server = http.createServer(handle).listen(sock);

    params.socketPath = sock;

    params.statusFilter = function () {

        return {
            accept: true,
            isRetryAllowed: false
        };
    };

    promise = vowAsker(params).then(function (res) {

        if (res.data === null) {
            res.data = new Buffer(0);
        }

        return res;
    });

    promise.always(function () {
        server.close();
    });

    return promise;
};
