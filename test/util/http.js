'use strict';

var Fs = require('fs');
var Http = require('http');
var asker = require('asker');
var sock = require('../stuff/sock');

module.exports = function (params, handle, receive) {

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

    return asker(params, function (err, res) {
        if (err) {
            receive(err);
        } else {

            if ( null === res.data ) {
                res.data = new Buffer(0);
            }

            receive(err, res);
        }
    });
};
