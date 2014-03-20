'use strict';

var R_FIELDNAME = /;\s*name=(?:"([^"]*)"|([^"]*))/;
var R_FILENAME = /;\s*filename=(?:"([^"]*)"|([^\s]*))/;

var Dicer = /** @type Dicer */ require('dicer');
var Parser = /** @type Parser */ require('./Parser');

/**
 * @class Multipart
 * @extends Parser
 * */
var Multipart = Parser.extend(/** @lends Multipart.prototype */ {

    /**
     * @protected
     * @memberOf {Multipart}
     * @method
     *
     * @param {Function} done
     * */
    _parse: function (done) {
        Multipart.parseMultipart(this._stream, this.params, done);
    },

    /**
     * @public
     * @memberOf {Multipart}
     * @property
     * @type {String}
     * */
    type: 'multipart',

    /**
     * @protected
     * @memberOf {Multipart}
     * @method
     *
     * @param {Array} res
     *
     * @returns {*}
     * */
    _template: function (res) {

        var body = Multipart.parent._template.call(this, res[0]);

        body.files = res[1];

        return body;
    }

}, /** @lends Multipart */ {

    /**
     * @public
     * @static
     * @memberOf Multipart
     *
     * @param {Object} stream
     * @param {Object} params
     * @param {Function} done
     * */
    parseMultipart: function (stream, params, done) {

        var parser = new Dicer(params);
        var received = 0;
        var result = [Object.create(null), Object.create(null)];

        function parserPart (part) {

            var buf = [];
            var file;
            var field;
            var mime;
            var partError = false;

            function partHeader (header) {

                var disposition = (header['content-disposition'] || [])[0];

                mime = (header['content-type'] || [])[0];
                field = R_FIELDNAME.exec(disposition);

                if ( null === field ) {
                    partError = true;

                    return;
                }

                //  заковыченное или простое значение заголовка
                field = field[1] || field[2];
                file = R_FILENAME.exec(disposition);

                if ( null === file ) {

                    return;
                }

                file = file[1] || file[2];
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

                if ( 'string' === typeof file ) {
                    sect = 1;

                    //  это был файл
                    buf = {
                        mime: mime,
                        name: file,
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
            done(null, result);
        }

        function parserError (err) {

            if ( cleanup.done ) {

                return;
            }

            if ( 'function' === typeof stream.pause ) {
                stream.pause();
            }

            cleanup();
            done(err);
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

        //  никогда не рушиться!
        parser.on('error', function () {});

        parser.on('error', parserError);
        stream.on('error', parserError);
        parser.on('finish', parserFinish);

        stream.pipe(parser);
    }

});

module.exports = Multipart;
