'use strict';

var Classic = /** @type Classic */ require('./router/Classic');
var Connect = /** @type Connect */ require('./track/Connect');
var Tracker = /** @type Tracker */ require('./Tracker');

/**
 * @class Server
 * @extends Tracker
 * */
var Server = Tracker.extend(/** @lends Server.prototype */ {

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Server.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Server}
         * @property {Classic}
         * */
        this.router = this._createRouter(this.params.router);
    },

    /**
     * @public
     * @memberOf {Server}
     * @method
     *
     * @returns {Function}
     * */
    getHandler: function () {

        var self = this;

        return function (req, res) {

            var date = new Date();
            var track = self._createTrack(req, res);

            res.once('finish', function () {
                track.time = new Date() - date;
                self.emitEvent('response', track);
            });

            self._handle(track);
        };
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Connect} track
     * @param {String} path
     * @param {Function} done
     * */
    resolve: function (track, path, done) {

        function resolve () {

            if ( track.sent() ) {

                return;
            }

            done.apply(this, arguments);
        }

        return Server.parent.resolve.call(this, track, path, resolve);
    },

    /**
     * @public
     * @memberOf {Server}
     * @method
     *
     * */
    route: function () {
        this.router.addRoute.apply(this.router, arguments);

        return this;
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {Track} track
     * @param {Array<String>|String} deps
     * @param {Function} done done(bundle)
     * */
    _bundle: function (track, deps, done) {

        var date = new Date();

        function resolve (bundle) {
            this.emitEvent('bundle', {
                time: new Date() - date,
                deps: deps,
                data: bundle
            });

            done.apply(this, arguments);
        }

        Server.parent._bundle.call(this, track, deps, resolve);
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {*} [params]
     *
     * @returns {Classic}
     * */
    _createRouter: function (params) {

        return new Classic(params);
    },

    /**
     * @public
     * @memberOf {Server}
     * @method
     *
     * @returns {Connect}
     * */
    _createTrack: function (req, res) {

        return new Connect(this, req, res);
    },

    /**
     * @protected
     * @memberOf {Server}
     * @method
     *
     * @param {Connect} track
     * */
    _handle: function (track) {

        var mdata;
        var rdata;

        this.emitEvent('request', track);

        if ( track.sent() ) {

            return;
        }

        mdata = this.router.find(track.method, track.url.pathname);

        if ( null === mdata ) {
            this.emitEvent('match-fail', track);
            track.send(404);

            return;
        }

        if ( Array.isArray(mdata) ) {
            this.emitEvent('match-fail', track);

            if ( 0 === mdata.length ) {
                track.send(501);

                return;
            }

            track.header('Allow', mdata.join(', '));
            track.send(405);

            return;
        }

        this.emitEvent('match-done', track);

        track.match = mdata.match;
        track.route = mdata.route.name;

        rdata = mdata.route.data;

        if ( Object(rdata) === rdata ) {
            rdata = rdata.unit;
        }

        this.resolve(track, rdata || track.route, function (err, res) {

            if ( 2 > arguments.length ) {
                track.send(500, err);

                return;
            }

            track.send(200, res);
        });
    }

});

module.exports = Server;
