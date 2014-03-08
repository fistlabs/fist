'use strict';

var Fist = require('../../../Fist');
var asker = require('asker');

var Fs = require('fs');
var sock = require('../../stuff/conf/sock');

module.exports = {

    arg: function (test) {

        var fist = new Fist();

        fist.route('GET', '/<page=about>/(<sub>)', 'index');

        fist.decl('index', function (track) {
            test.strictEqual(track.arg('page', true), 'about');
            test.strictEqual(track.arg('sub'), '80');
            track.send(200);
        });

        try {
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            socketPath: sock,
            path: '/about/?page=index&sub=80'
        }, function (err, data) {
            test.ok(data);
            test.strictEqual(data.statusCode, 200);
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
            Fs.unlinkSync(sock);
        } catch (ex) {}

        fist.listen(sock);

        asker({
            method: 'GET',
            socketPath: sock,
            path: '/'
        }, function (err, data) {
            test.strictEqual(data.data + '', '/about/?text=test');
            test.done();
        });
    }
};
