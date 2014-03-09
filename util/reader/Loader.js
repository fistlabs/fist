'use strict';

var Reader = /** @type Reader */ require('./Reader');

/**
 * @class Loader
 * @extends Reader
 * */
var Loader = Reader.extend(/** @lends Loader.prototype */ {

    /**
     * @protected
     * @memberOf {Loader}
     * @method
     *
     * @param {*} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        Loader.download(this._readable, opts, done);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Loader
     * @method
     *
     * @param {EventEmitter} stream
     * @param {Object} opts
     * @param {Function} done
     * */
    download: function (stream, opts, done) {

        var buf = [];

        function cleanup () {
            stream.removeListener('data', data);
            stream.removeListener('error', error);
            stream.removeListener('end', end);
            stream.removeListener('close', cleanup);
        }

        function data (chunk) {
            buf[buf.length] = chunk;
        }

        function error (err) {
            cleanup();
            done(err);
        }

        function end () {
            cleanup();
            done(null, Buffer.concat(buf));
        }

        stream.on('data', data);
        stream.on('error', error);
        stream.on('end', end);
        stream.on('close', cleanup);
    }
});

module.exports = Loader;
