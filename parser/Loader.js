'use strict';

var Parser = /** @type Parser */ require('./Parser');

/**
 * @class Loader
 * @extends Parser
 * */
var Loader = Parser.extend(/** @lends Loader.prototype */ {

    /**
     * @protected
     * @memberOf {Loader}
     * @method
     *
     * @param {Function} done
     * */
    _parse: function (done) {
        Loader._download(this._readable, this.params, done);
    }

}, {

    /**
     * @protected
     * @static
     * @memberOf Loader
     * @method
     *
     * @param {Object} stream
     * @param {Object} opts
     * @param {Function} done
     * */
    _download: function (stream, opts, done) {

        var buf = [];
        var received = 0;

        function cleanup () {
            stream.removeListener('data', data);
            stream.removeListener('error', error);
            stream.removeListener('end', end);
            stream.removeListener('close', cleanup);
        }

        function data (chunk) {

            if ( !Buffer.isBuffer(chunk) ) {
                chunk = new Buffer(String(chunk));
            }

            received += chunk.length;

            if ( received > opts.limit ) {
                stream.emit('error', Parser.ELIMIT({
                    expected: opts.limit,
                    actual: received
                }));

                return;
            }

            buf[buf.length] = chunk;
        }

        function error (err) {

            if ( 'function' === typeof stream.pause ) {
                stream.pause();
            }

            cleanup();
            done(err);
        }

        function end () {

            if ( Infinity !== opts.length && received !== opts.length ) {
                stream.emit('error', Parser.ELENGTH({
                    expected: opts.length,
                    actual: received
                }));

                return;
            }

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
