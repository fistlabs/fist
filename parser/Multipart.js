'use strict';

var R_FIELDNAME = /;\s*name=(?:"([^"]*)"|([^"]*))/;
var R_FILENAME = /;\s*filename=(?:"([^"]*)"|([^\s]*))/;
var R_MULTIPART =
    /^multipart\/[^\s]+?;[\s\r\n]+boundary=(?:"([^"]+)"|([^\s]+))$/i;

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
        Multipart.parseMultipart(this._readable, this.params, done);
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
    parseMultipart: function (stream, opts, done) {

        var parser = new Dicer(opts);
        var received = 0;
        var result = [Object.create(null), Object.create(null)];

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
                part.removeListener('data', partData);
            }

            part.on('data', partData);

            part.once('header', partHeader);
            part.once('end', partEnd);
        }

        function parserFinish () {

            if ( cleanup.done ) {

                return;
            }

            if ( Infinity !== opts.length && received !== opts.length ) {
                parser.emit('error', Parser.ELENGTH({
                    actual: received,
                    expected: opts.length
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

            if ( received > opts.limit ) {
                stream.emit('error', Parser.ELIMIT({
                    actual: received,
                    expected: opts.limit
                }));
            }
        }

        function cleanup () {
            cleanup.done = true;
            parser.removeListener('part', parserPart);
            stream.removeListener('data', streamData);

//            parser.removeListener('error', parserError);
        }

        parser.on('part', parserPart);
        stream.on('data', streamData);

        parser.on('error', parserError);
        parser.once('finish', parserFinish);
        stream.once('error', parserError);

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
