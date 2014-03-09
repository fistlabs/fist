'use strict';

var R_FIELDNAME = /;\s*name=(?:"([^"]*)"|([^"]*))/;
var R_FILENAME = /;\s*filename=(?:"([^"]*)"|([^\s]*))/;
var R_MULTIPART =
    /^multipart\/[^\s]+?;[\s\r\n]+boundary=(?:"([^"]+)"|([^\s]+))$/i;

var Parser = /** @type Parser */ require('dicer');
var Reader = /** @type Reader */ require('./Reader');

/**
 * @class Multipart
 * @extends Reader
 * */
var Multipart = Reader.extend(/** @lends Multipart.prototype */ {

    /**
     * @protected
     * @memberOf {Multipart}
     * @method
     *
     * @param {Object} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        Multipart.parse(this._readable, opts, done);
    }

}, /** @lends Multipart */ {

    /**
     * @public
     * @static
     * @memberOf Multipart
     *
     * @param {Object} stream
     * @param {Object} opts
     * @param {Function} done
     * */
    parse: function (stream, opts, done) {

        var parser = new Parser(opts);
        var received = 0;
        var result = {
            input: Object.create(null),
            files: Object.create(null),
            type: 'multipart'
        };
        var streamError;

        parser.on('part', function (part) {

            var file;
            var field;
            var partError = false;
            var buf = [];
            var mime;

            part.on('header', function (header) {

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
            });

            part.on('data', function (chunk) {
                buf[buf.length] = chunk;
            });

            part.on('end', function () {

                var sect = 'input';

                if ( partError ) {

                    return;
                }

                buf = Buffer.concat(buf);

                if ( 'string' === typeof file ) {
                    sect = 'files';

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
            });
        });

        streamError = parser.emit.bind(parser, 'error');

        function parserFinish () {

            if ( Infinity !== opts.length && received !== opts.length ) {
                parser.emit('error', Reader.ELENGTH({
                    actual: received,
                    expected: opts.length
                }));

                return;
            }

            cleanup();
            done(null, result);
        }

        function parserError (err) {

            if ( 'function' === typeof stream.pause ) {
                stream.pause();
            }

            cleanup();

            done(err);
        }

        function streamData (chunk) {

            if ( !Buffer.isBuffer(chunk) ) {
                chunk = new Buffer(String(chunk));
            }

            received += chunk.length;

            if ( received > opts.limit ) {
                stream.emit('error', Reader.ELIMIT({
                    actual: received,
                    expected: opts.limit
                }));
            }
        }

        function cleanup () {
            parser.removeListener('finish', parserFinish);
            parser.removeListener('error', parserError);
            stream.removeListener('error', streamError);
            stream.removeListener('data', streamData);
        }

        parser.on('finish', parserFinish);
        parser.on('error', parserError);
        stream.on('error', streamError);
        stream.on('data', streamData);

        stream.pipe(parser);
    },

    /**
     * @public
     * @static
     * @memberOf Multipart
     * @method
     *
     * @param {Object} req
     *
     * @returns {*}
     * */
    isMultipart: function (req) {

        var m = R_MULTIPART.exec(req.headers['content-type']);

        if ( null === m ) {

            return m;
        }

        return m[1] || m[2];
    }
});

module.exports = Multipart;
