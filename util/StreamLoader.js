'use strict';

var Loader = /** @type Loader */ require('./Loader');

/**
 * @class StreamLoader
 * @extends Loader
 * */
var StreamLoader = Loader.extend(/** @lends StreamLoader.prototype */ {

    /**
     * @protected
     * @memberOf {StreamLoader}
     * @method
     *
     * @param {*} opts
     * @param {Function} done
     * */
    _parse: function (opts, done) {
        StreamLoader.download(this._readable, done);
    }

}, {

    /**
     * @public
     * @static
     * @memberOf StreamLoader
     * @method
     *
     * @param {EventEmitter} stream
     * @param {Function} done
     * */
    download: function (stream, done) {

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

module.exports = StreamLoader;
