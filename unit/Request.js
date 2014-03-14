'use strict';

var Ask = /** @type Ask */ require('../util/Ask');
var Unit = /** @type Unit */ require('./Unit');

var asker = require('asker');

/**
 * @class Request
 * @extends Unit
 * */
var Request = Unit.extend(/** @lends Request.prototype */ {

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Connect} track
     * @param {Object} errors
     * @param {Object} result
     * @param {Function} done
     *
     * @returns {Ask}
     * */
    _createAsk: function (track, errors, result, done) {

        return new Ask(track, errors, result, done);
    },

    /**
     * @public
     * @memberOf {Request}
     * @method
     *
     * @param {Connect} track
     * @param {Object} errors
     * @param {Object} result
     * @param {Function} done
     * */
    data: function (track, errors, result, done) {

        var ask = this._createAsk(track, errors, result, done.bind(this));

        this._options(ask);

        ask.next(function (res, done) {
            ask.opts = res;
            track.agent.emitEvent('sys:req:options', ask);
            done(null, res);
        }, function (err) {
            ask.opts = err;
            track.agent.emitEvent('sys:req:eoptions', ask);
            this._onEOPTIONS(ask);
        }, this);

        this._setup(ask);

        ask.next(function (res, done) {
            track.agent.emit('sys:req:setup', ask);
            done(null, res);
        }, function (err) {
            ask.opts = err;
            track.agent.emit('sys:req:esetup', ask);
            this._onESETUP(ask);
        }, this);

        this._request(ask);

        ask.next(function (res, done) {
            ask.data = res;
            track.agent.emitEvent('sys:req:response', ask);
            done(null, res);
        }, function (err) {
            ask.data = err;
            track.agent.emitEvent('sys:req:erequest', ask);
            this._onEREQUEST(ask);
        }, this);

        this._parse(ask);

        ask.next(function (res, done) {
            ask.data.data = res;
            track.agent.emitEvent('sys:req:parse', ask);
            done(null, ask.data);
        }, function (err) {
            ask.data = err;
            track.agent.emitEvent('sys:req:eparse', ask);
            this._onEPARSE(ask);
        }, this);

        this._resolve(ask);

        ask.next(function (res) {
            ask.data = res;
            track.agent.emit('sys:req:resolve', ask);
            ask.done(null, res);
        }, function (err) {
            ask.data = err;
            track.agent.emit('sys:req:eresolve', ask);
            this._onERESOLVE(ask);
        }, this);
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Ask} ask
     * */
    _options: function (ask) {
        ask.next(function (res, done) {
            res.port = 80;
            res.path = '/';
            res.method = 'GET';
            res.protocol = 'http:';
            done(null, res);
        });
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Ask} ask
     * */
    _setup: function (ask) {
        /*eslint no-unused-vars: 0*/
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Ask} ask
     * */
    _request: function (ask) {
        ask.next(function (opts, done) {
            asker(opts, function (err, res) {
                if ( err ) {
                    done(err);
                } else {
                    done(null, res);
                }
            });
        });
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _parse: function (ask) {
        ask.next(function (res, done) {
            try {
                res = JSON.parse(res.data);

            } catch (err) {
                done(err);

                return;
            }

            done(null, res);
        });
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _resolve: function (ask) {
        ask.next(function (res, done) {
            done(null, res);
        });
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _onEOPTIONS: function (ask) {
        ask.done(ask.opts);
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _onESETUP: function (ask) {
        ask.done(ask.opts);
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _onEREQUEST: function (ask) {
        ask.done(ask.data);
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _onEPARSE: function (ask) {
        ask.done(ask.data);
    },

    /**
     * @protected
     * @memberOf {Request}
     * @method
     *
     * @param {Object} ask
     * */
    _onERESOLVE: function (ask) {
        ask.done(ask.data);
    }

});

module.exports = Request;
