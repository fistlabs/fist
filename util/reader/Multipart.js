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

        function parserPart (part) {

            var file;
            var field;
            var partError = false;
            var buf = [];
            var mime;

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

                var sect = 'input';

                if ( partError ) {
                    partCleanup();

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
            parser.removeListener('part', parserPart);
            parser.removeListener('error', parserError);
            parser.removeListener('finish', parserFinish);
            stream.removeListener('data', streamData);
            stream.removeListener('error', parserError);
        }

        parser.on('part', parserPart);
        parser.on('error', parserError);
        parser.on('finish', parserFinish);
        stream.on('data', streamData);
        stream.on('error', parserError);

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
