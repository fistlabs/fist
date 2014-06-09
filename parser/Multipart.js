'use strict';

var ContentType = /** @type ContentType */ require('../util/ContentType');
var Dicer = /** @type Dicer */ require('dicer');
var MediaHead = /** @type MediaHead */ require('../util/MediaHead');
var Parser = /** @type Parser */ require('./Parser');

var inherit = require('inherit');
var vow = require('vow');

/**
 * @class Multipart
 * @extends Parser
 * */
var Multipart = inherit(Parser, /** @lends Multipart.prototype */ {

    /**
     * @public
     * @memberOf {Multipart}
     * @method
     *
     * @param {Object} stream
     *
     * @returns {vow.Promise}
     * */
    parse: function (stream) {

        return parseMultipart(stream, this.params);
    },

    /**
     * @public
     * @memberOf {Multipart}
     * @property
     * @type {String}
     * */
    type: 'multipart'

}, /** @lends Multipart */ {

    /**
     * @public
     * @static
     * @memberOf Multipart
     * @method
     *
     * @param {Object} media
     *
     * @returns {Boolean}
     * */
    matchMedia: function (media) {

        return 'multipart' === media.type;
    }

});

/**
 * @private
 * @static
 * @memberOf Multipart
 *
 * @param {Object} stream
 * @param {Object} params
 *
 * @returns {vow.Promise}
 * */
function parseMultipart (stream, params) {

    var defer = vow.defer();
    var parser = new Dicer(params);
    var received = 0;
    var result = [Object.create(null), Object.create(null)];

    function parserPart (part) {

        var buf = [];
        var filename;
        var field;
        var mime;
        var partError = false;

        function partHeader (header) {

            var disp = (header['content-disposition'] || [])[0];

            disp = new MediaHead(disp);
            field = disp.params.name;

            if ( field ) {
                filename = disp.params.filename;

                if ( filename ) {
                    mime = (header['content-type'] || [])[0];
                    mime = new ContentType(mime);
                }

                return;
            }

            partError = true;
        }

        function partData (chunk) {
            buf[buf.length] = chunk;
        }

        function partEnd () {

            var sect = 0;

            if ( partError ) {
                partCleanup();

                return;
            }

            buf = Buffer.concat(buf);

            if ( mime ) {
                sect = 1;

                //  это был файл
                buf = {
                    mime: mime.value,
                    name: filename,
                    data: buf
                };

            } else {
                buf = String(buf);
            }

            if ( Array.isArray(result[sect][field]) ) {
                result[sect][field].push(buf);

            } else {

                if ( field in result[sect] ) {
                    result[sect][field] = [result[sect][field], buf];

                } else {
                    result[sect][field] = buf;
                }
            }

            partCleanup();
        }

        function partCleanup () {
            part.removeListener('header', partHeader);
            part.removeListener('data', partData);
            part.removeListener('end', partEnd);
        }

        part.on('header', partHeader);
        part.on('data', partData);
        part.on('end', partEnd);
    }

    function parserFinish () {

        if ( Infinity !== params.length && received !== params.length ) {
            parser.emit('error', Parser.ELENGTH({
                actual: received,
                expected: params.length
            }));

            return;
        }

        cleanup();
        defer.resolve(result);
    }

    function parserError (err) {

        if ( cleanup.done ) {

            return;
        }

        if ( 'function' === typeof stream.pause ) {
            stream.pause();
        }

        cleanup();
        defer.reject(err);
    }

    function streamData (chunk) {

        if ( cleanup.done ) {

            return;
        }

        if ( !Buffer.isBuffer(chunk) ) {
            chunk = new Buffer(String(chunk));
        }

        received += chunk.length;

        if ( received > params.limit ) {
            stream.emit('error', Parser.ELIMIT({
                actual: received,
                expected: params.limit
            }));
        }
    }

    function cleanup () {
        parser.removeListener('part', parserPart);
        stream.removeListener('data', streamData);

        stream.removeListener('error', parserError);
        parser.removeListener('error', parserError);
        parser.removeListener('finish', parserFinish);
        cleanup.done = true;
    }

    parser.on('part', parserPart);
    stream.on('data', streamData);

    //  никогда не рушиться! (то есть не бросать исключений)
    parser.on('error', function () {});

    parser.on('error', parserError);
    stream.on('error', parserError);
    parser.on('finish', parserFinish);

    stream.pipe(parser);

    return defer.promise();
}

module.exports = Multipart;
