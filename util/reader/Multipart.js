'use strict';

var R_FIELDNAME = /;\s*name=(?:"([^"]*)"|([^"]*))/;
var R_FILENAME = /;\s*filename=(?:"([^"]*)"|([^\s]*))/;
var R_MULTIPART =
    /^multipart\/[^\s]+?;[\s\r\n]+boundary=(?:"([^"]+)"|([^\s]+))$/i;

var Dicer = /** @type Dicer */ require('dicer');
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
     * @param {Readable} stream
     * @param {Object} opts
     * @param {Function} done
     * */
    parse: function (stream, opts, done) {

        var dicer = new Dicer(opts);
        var result = {input: Object.create(null), files: Object.create(null)};
        var parserError = false;

        dicer.on('part', function (part) {

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

        dicer.on('finish', function () {

            if ( parserError ) {

                return;
            }

            done(null, result);
        });

        dicer.on('error', function (err) {
            parserError = true;
            done(err);
        });

        stream.on('error', function (err) {
            dicer.emit('error', err);
        });

        stream.pipe(dicer);
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
