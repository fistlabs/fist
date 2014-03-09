'use strict';

var Connect = /** @type Connect */ require('./track/Connect');
var Tracker = /** @type Tracker */ require('./Tracker');
var Classic = /** @type Classic */ require('fist.router/Classic');

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

        var agent = this;

        return function (req, res) {

            var track = agent._createTrack(req, res);

            res.once('finish', function () {
                agent.emitEvent('response', track);
            });

            agent._handle(track);
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

        var date = new Date();

        function resolve () {
            // jshint validthis: true
            var stat;

            if ( track.sent() ) {

                return;
            }

            stat = +(1 < arguments.length);

            this.emitEvent(['reject', 'accept'][stat], {
                data: arguments[stat],
                path: path,
                time: new Date() - date
            });

            done.apply(this, arguments);
        }

        return Server.parent.resolve.call(this, track, path, resolve);
    },

    /**
     * @public
     * @memberOf {Server}
     * @method
     *
     * @param {String} verb
     * @param {String} expr
     * @param {String} name
     * @param {String} [data]
     * */
    route: function (verb, expr, name, data) {
        this.router.addRoute(verb, expr, name, data);

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
            // jshint validthis: true
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

        this.emitEvent('request', track);

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

        this.resolve(track, mdata.route.data || track.route, function () {

            var done = +(1 < arguments.length);

            track.send([500, 200][done], arguments[done]);
        });
    }

});

module.exports = Server;
