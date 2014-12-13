'use strict';

var express = require('express');
var app = express();

app.get('/index/', function (req, res) {
    res.end('OK');
});

app.listen(1337);
