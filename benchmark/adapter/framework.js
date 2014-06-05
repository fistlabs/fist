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

app.unit({
    path: '_',
    deps: ['a'],
    data: function (track) {
        track.send();
    }
});

app.unit({
    path: 'a',
    deps: ['b'],
    data: function (track, errors, result, done) {
        done(null, 'a');
    }
});

app.unit({
    path: 'b',
    deps: [],
    data: function (track, errors, result, done) {
        done(null, 'b');
    }
});

app.route('GET /page/<pageName>/', '_');

/*eslint no-sync: 0*/
try {
    Fs.unlinkSync(sock);
} catch (ex) {}

if ( 'function' === typeof app.ready ) {
    app.ready();
}

Http.createServer(app.getHandler()).listen(sock);

module.exports = function (done) {
    Http.request({
        method: 'GET',
        socketPath: sock,
        path: path
    }, done).end();
};
