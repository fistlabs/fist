'use strict';

var express = require('express');
var app = express();

app.use(function (req, res, next) {
    next();
});

app.use(function (req, res, next) {
    next();
});

app.get('/:page/', function (req, res) {
    res.send('OK');
});

app.listen(1337);
