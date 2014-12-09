'use strict';

var express = require('express');
var app = express();

app.set('strict routing', true);

app.get('/:page/foo/', function (req, res) {
    res.end('foo');
});

app.get('/:page/bar/', function (req, res) {
    res.end('bar');
});

app.get('/:page/', function (req, res) {
    res.end('index');
});

app.listen(1337);
