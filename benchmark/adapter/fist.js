'use strict';

var Fs = require('fs');
var Fist = require('../../Fist');
var app = new Fist();
var sock = 'benchmark/fist.sock';
var Http = require('http');
var path = require('../lib/path');

app.decl('_', ['a'], function (track) {
    track.send();
});

app.decl('a', ['b'], function (track, errors, result, done) {
    done(null, 'a');
});

app.decl('b', [], function (track, errors, result, done) {
    done(null, 'b');
});

app.route('GET', '/page/<pageName>/', '_');

try {
    Fs.unlinkSync(sock);
} catch (ex) {}

app.listen(sock);

module.exports = function (done) {
    Http.request({ method: 'GET', socketPath: sock, path: path }, done).end();
};

