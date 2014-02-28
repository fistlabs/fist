'use strict';

var Fist = require('../Fist');
var asker = require('asker');

var Fs = require('fs');
var SOCK = 'test/conf/fist.sock';

module.exports = {

    buildUrl: function (test) {

        var fist = new Fist();

        fist.route('GET', '/(<pageName>/)', 'url');

        fist.decl('url', function (track, errors, result, done) {
            done(null, track.buildUrl('url', {
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
