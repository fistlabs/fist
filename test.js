'use strict';

var http = require('http');
var uniqueId = require('unique-id');
var fin = require('on-finished');

http.createServer(function (req, res) {
    req.id = uniqueId();
    var sock = req.socket;

    console.log('%s %s INCOMING', new Date(), req.id);

    res.on('finish', function () {
        console.log('%s %s FINISHED %j %j', new Date(), req.id, res.headersSent, res.finished);
    });

    res.on('close', function () {
        console.log('%s %s CLOSED %j %j', new Date(), req.id, res.headersSent, res.finished);
    });

    fin(res, function (err, res) {
        console.log('%s on-finished test FINISHED', req.id);
    });

    setTimeout(function () {
        res.end(req.id);
        console.log('%s %s END', new Date(), req.id);
    }, 2000);
}).listen(1337);
