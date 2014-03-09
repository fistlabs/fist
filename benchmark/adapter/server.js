'use strict';

var Fs = require('fs');

/**
 * @class MyServer
 * @extends Server
 * */
var MyServer = /** @type Server */ require('../../Server').extend({
    //  Не триггерить события во время бенчмарка
    // для чистоты эксперимета
    emitEvent: function () {}
});

var app = new MyServer();
var sock = 'benchmark/fist.sock';
var Http = require('http');
var path = require('../lib/path');

app.decl('_', ['a'], function () {
    this.send();
});

app.decl('a', ['b'], function (bundle, done) {
    done(null, 'a');
});

app.decl('b', [], function (bundle, done) {
    done(null, 'b');
});

app.route('GET', '/page/<pageName>/', '_');

try {
    Fs.unlinkSync(sock);
} catch (ex) {}

Http.createServer(app.getHandler()).listen(sock);

module.exports = function (done) {
    Http.request({
        method: 'GET',
        socketPath: sock,
        path: path
    }, done).end();
};
