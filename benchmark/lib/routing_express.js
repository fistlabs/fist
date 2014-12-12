/*eslint no-console: 0*/
'use strict';

var express = require('express');
var app = express();
var routes = 100;
var uniqueId = require('unique-id');
var f = require('util').format;

app.set('strict routing', true);
console.log('%d routes', routes);

function setGet(name) {
    app.get(f('/:page/%s/', name), function (req, res) {
        res.end(name);
    });
}

while (routes) {
    routes -= 1;
    setGet(uniqueId());
}

app.get('/:page/', function (req, res) {
    res.end('index');
});

app.listen(1337);
