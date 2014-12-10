'use strict';

var Busboy = /** @type Busboy */ require('busboy');
var FistError = /** @type FistError */ require('../../core/fist-error');

var _ = require('lodash-node');
var errors = {
    400: 'BAD_REQUEST_ENTITY',
    413: 'BAD_REQUEST_ENTITY_SIZE',
    500: 'BAD_INTERNAL_SETTINGS',
    415: 'BAD_REQUEST_MEDIA_TYPE'
};
var rawBody = require('raw-body');
var typer = require('media-typer');
var vow = require('vow');

module.exports = function (agent) {

    /**
     * @class fist_contrib_unit_incoming
     * @extends Unit
     * */
    agent.unit({

        /**
         * @public
         * @memberOf {fist_contrib_unit_incoming}
         * @property
         * @type {String}
         * */
        base: 0,

        /**
         * @public
         * @memberOf {fist_contrib_unit_incoming}
         * @property
         * @type {String}
         * */
        name: 'fist_contrib_unit_incoming',

        /**
         * @public
         * @memberOf {fist_contrib_unit_incoming}
         * @property
         * @type {Number}
         * */
        maxAge: 0,

        /**
         * @public
         * @memberOf {fist_contrib_unit_incoming}
         * @property
         * @type {Object}
         * */
        params: {
            toString: function () {
                return '';
            }
        },

        /**
         * @public
         * @memberOf {fist_contrib_unit_incoming}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {vow.Promise}
         * */
        main: function (track, context) {
            var mime = typer.parse(track.header('Content-Type') || 'text/plain');
            var promise;

            //  the only mimes supported by busboy
            if (mime.type === 'multipart' || mime.type === 'application' && mime.subtype === 'x-www-form-urlencoded') {
                promise = vow.invoke(function (self) {
                    //  may throw during instantiation
                    return self._busboy(track, context, mime);
                }, this);
            } else {
                promise = this._other(track, context, mime);
            }

            return promise.fail(function (err) {
                var status = err && err.status || 400;
                var code = errors.hasOwnProperty(status) ? errors[status] : errors[400];
                err = new FistError(code, err && err.message);
                track.status(status).send();
                throw err;
            });
        },

        /**
         * @protected
         * @memberOf {fist_contrib_unit_incoming}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         * @param {Object} mime
         *
         * @returns {vow.Promise}
         * */
        _getRawBody: function (track, context, mime) {
            var defer = vow.defer();

            rawBody(track.req, {
                length: track.header('Content-Length'),
                limit: Infinity,
                encoding:  mime.parameters.charset
            }, function (err, res) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve(res);
                }
            });

            return defer.promise();
        },

        /**
         * @protected
         * @memberOf {fist_contrib_unit_incoming}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         * @param {Object} mime
         *
         * @returns {vow.Promise}
         * */
        _other: function (track, context, mime) {
            return this._getRawBody(track, context, mime).then(function (res) {
                //  support for application/json
                if (mime.type === 'application' && mime.subtype === 'json') {
                    return {
                        type: 'json',
                        input: JSON.parse(res),
                        files: {}
                    };
                }

                if (mime.type === 'text' && mime.subtype === 'plain') {
                    return {
                        type: 'text',
                        input: String(res),
                        files: {}
                    };
                }

                return {
                    type: 'raw',
                    input: res,
                    files: {}
                };
            });
        },

        /**
         * @protected
         * @memberOf {fist_contrib_unit_incoming}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         * @param {Object} mime
         *
         * @returns {Busboy}
         * */
        _createBusboy: function (track, context, mime) {
            /*eslint no-unused-vars: 0*/
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

        /**
         * @protected
         * @memberOf {fist_contrib_unit_incoming}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         * @param {Object} mime
         *
         * @returns {vow.Promise}
         * */
        _busboy: function (track, context, mime) {
            var fullData = [];
            var actualLength = 0;
            var expectedLength = Number(track.header('Content-Length'));
            var busboy = this._createBusboy(track, context, mime);
            var defer = vow.defer();
            var input = {};
            var files = {};
            var result = {
                type: mime.type === 'multipart' ? mime.type : 'urlencoded',
                input: input,
                files: files
            };

            busboy.on('file', function (name, file, filename, encoding, mime) {
                /*eslint max-params: 0*/
                var content = [];
                var fileObj = {
                    encoding: encoding,
                    mime: mime,
                    filename: filename,
                    content: content
                };

                file.on('data', function (data) {
                    content[content.length] = data;
                });

                file.on('end', function () {
                    fileObj.content = Buffer.concat(content);

                    if (!_.has(files, name)) {
                        files[name] = fileObj;
                    } else if (!_.isArray(files[name])) {
                        files[name] = [files[name], fileObj];
                    } else {
                        files[name].push(fileObj);
                    }
                });
            });

            busboy.on('field', function (name, value/*, nameTruncated, valueTruncated*/) {
                if (!_.has(input, name)) {
                    input[name] = value;
                } else if (!_.isArray(input[name])) {
                    input[name] = [input[name], value];
                } else {
                    input[name].push(value);
                }
            });

            busboy.on('finish', function () {
                if (actualLength === expectedLength) {
                    defer.resolve(result);
                } else {
                    defer.reject(new Error('request size did not match content length'));
                }
            });

            busboy.on('error', function (err) {
                defer.reject(err);
            });

            track.req.pipe(busboy);

            track.req.on('data', function (chunk) {
                fullData[fullData.length] = chunk;
                actualLength += chunk.length;
            });

            track.req.on('end', function () {
                context.logger.info('Incoming data\n%s', Buffer.concat(fullData).toString());
            });

            return defer.promise();
        }
    });

};
