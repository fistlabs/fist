'use strict';

var express = require('express');
var app = express();

var size = 39;

function noop(req, res, next) {
    next();
}

while (size) {
    size -= 1;
    app.use(noop);
}

app.get('/:page/', function (req, res) {
    res.end('OK');
});

app.listen(1337);
