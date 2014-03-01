'use strict';

var Fist = require('../Fist');
var asker = require('asker');

var Fs = require('fs');
var SOCK = 'test/conf/fist.sock';

module.exports = {

    arg: function (test) {

        var fist = new Fist();

        fist.route('GET', '/<page>/(<sub>)', 'index');

        fist.decl('index', function (track, errors, result, done) {
            test.strictEqual(track.arg('page', true), 'about');
            test.strictEqual(track.arg('sub'), '80');
            track.send(200);
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (ex) {}

        fist.listen(SOCK);

        asker({
            method: 'GET',
            socketPath: SOCK,
            path: '/about/?page=index&sub=80'
        }, function (err, data) {
            test.done();
        });
    },

    buildPath: function (test) {

        var fist = new Fist();

        fist.route('GET', '/(<pageName>/)', 'url');

        fist.decl('url', function (track, errors, result, done) {
            done(null, track.buildPath('url', {
                pageName: 'about',
                text: 'test'
            }));
        });

        try {
            Fs.unlinkSync(SOCK);
        } catch (ex) {}

        fist.listen(SOCK);

        asker({
            method: 'GET',
            socketPath: SOCK,
            path: '/'
        }, function (err, data) {
            test.strictEqual(data.data + '', '/about/?text=test');
            test.done();
        });
    }
};
