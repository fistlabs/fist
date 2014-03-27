'use strict';

var Fs = require('fs');

/**
 * @class MyServer
 * @extends Server
 * */
var MyServer = /** @type Server */ require('../../Framework').extend({
    //  Не триггерить события во время бенчмарка
    // для чистоты эксперимета
    emit: function () {}
});

var app = new MyServer();
var sock = 'benchmark/framework.sock';
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

/*eslint no-sync: 0*/
try {
    Fs.unlinkSync(sock);
} catch (ex) {}

app.ready();
Http.createServer(app.getHandler()).listen(sock);

module.exports = function (done) {
    Http.request({
        method: 'GET',
        socketPath: sock,
        path: path
    }, done).end();
};
