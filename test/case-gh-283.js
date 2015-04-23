'use strict';

var fist = require('../fist');
var fs = require('fs');
var path = require('path');
var supertest = require('supertest');

describe('gh-283', function () {

    it('Should send css file', function (done) {
        var app = fist();

        app.unit({
            name: 'static',

            main: function (track) {
                var pathToFile = path.join(__dirname, 'fixtures/css', 'test.css');
                var readable = fs.createReadStream(pathToFile);

                track.header({'Content-Type': 'text/css'});

                track.send(readable);
            }
        });

        app.route('GET /', 'static');

        supertest(app.getHandler()).
            get('/').
            expect('Content-Type', 'text/css').
            expect(200).
            end(done);
    });
});
