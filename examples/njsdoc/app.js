'use strict';

var configs = require('./configs');
var fist = require('fist');
var app = fist(configs);

app.listen(app.params.port);
