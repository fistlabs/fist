'use strict';

var Fs = require('fs');
var express = require('express');
var app = express();
var sock = 'benchmark/express.sock';
var path = require('../lib/path');
var Http = require('http');

app.use(function (req, res, next) {
    next();
});

app.use(function (req, res, next) {
    next();
});

app.get('/page/:pageName/', function (req, res) {
    res.send();
});

/*eslint no-sync: 0*/
try {
    Fs.unlinkSync(sock);
} catch (ex) {}

app.listen(sock);

module.exports = function (done) {
    Http.request({
        method: 'GET',
        socketPath: sock,
        path: path
    }, done).end();
};
