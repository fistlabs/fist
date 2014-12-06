'use strict';

var Busboy = require('busboy');

var _ = require('lodash-node');
var typer = require('media-typer');
var vow = require('vow');
var rawBody = require('raw-body');

module.exports = function (agent) {

    agent.unit({
        base: '_fist_contrib_unit_common',
        name: 'fist_contrib_unit_incoming_data',
        main: function (track, context) {
            var defer;
            var mime = track.header('Content-Type');

            if (mime) {
                mime = typer.parse(mime);

                if (mime.type === 'multipart' ||
                    (mime.type === 'application' && mime.subtype === 'x-www-form-urlencoded')) {

                    return this._busboy(track, context);
                }
            }

            defer = vow.defer();

            //  TODO!!!!
            rawBody(track.incoming, {
                length: track.header('Content-length'),
                limit: Infinity,
                encoding: mime && mime.parameters.charset
            }, function (err, res) {
                if (err) {
                    track.send(err.status);
                    defer.reject(err);
                } else {
                    defer.resolve(res);
                }
            });

            return defer.promise().then(function (res) {
                if (mime && mime.type === 'application' && mime.subtype === 'json') {
                    return {
                        type: 'json',
                        input: JSON.parse(res),
                        files: {}
                    };
                }

                return {
                    type: 'raw',
                    input: res,
                    files: {}
                }
            });
        },

        _createBusboy: function (track) {
            return new Busboy({
                headers: track.header(),
                defCharset: 'utf-8',
                limits: {
                    fieldNameSize: Infinity,
                    fieldSize: Infinity,
                    fields: Infinity,
                    fileSize: Infinity,
                    files: Infinity,
                    parts: Infinity,
                    headerPairs: 2000
                }
            });
        },

        _busboy: function (track, context) {
            var busboy = this._createBusboy(track, context);
            var defer = vow.defer();
            var input = {};
            var files = {};
            var result = {
                type: 'multipart',
                input: input,
                files: files
            };

            busboy.on('file', function(name, file, filename, encoding, mime) {
                var contents = [];
                var fileObj = {
                    encoding: encoding,
                    mime: mime,
                    filename: filename,
                    contents: contents
                };

                file.on('data', function(data) {
                    contents[contents.length] = data;
                });

                file.on('end', function() {
                    fileObj.contents = Buffer.concat(contents);
                    files[name] = fileObj;
                });
            });

            busboy.on('field', function(name, value/*, nameTruncated, valueTruncated*/) {
                if (!_.has(input, name)) {
                    input[name] = value;
                } else if (!_.isArray(input[name])) {
                    input[name] = [input[name], value];
                } else {
                    input[name].push(value);
                }
            });

            busboy.on('finish', function() {
                defer.resolve(result);
            });

            track.incoming.pipe(busboy);

            return defer.promise();
        }
    });

};
