'use strict';

var Http = require('http');
var Nested = /** @type Nested */ require('./bundle/Nested');
var Runtime = /** @type Runtime */ require('./track/Runtime');
var Server = /** @type Server */ require('./Server');
var Task = /** @type Task */ require('./util/Task');
var Toobusy = /** @type Toobusy */ require('./util/Toobusy');
var caller = require('./util/caller');

/**
 * @class Framework
 * @extends Server
 * */
var Framework = Server.extend(/** @lends Framework.prototype */ {

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Framework.Parent.apply(this, arguments);

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array}
         * */
        this._tasks = [];

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Array}
         * */
        this._pends = [];

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Number}
         * */
        this._pending = 0;

        /**
         * @protected
         * @memberOf {Framework}
         * @property
         * @type {Toobusy}
         * */
        this._toobusy = new Toobusy({
            maxLag: this.params.busyHWM
        });

    },

    /**
     * @public
     * @memberOf {Framework}
     * @method
     * */
    listen: function () {

        var server = Http.createServer(this.getHandler());

        server.listen.apply(server, arguments);
        //  автоматически запускаю инициализацию
        this.ready();
    },

    /**
     * @public
     * @memberOf {Framework}
     * @method
     * */
    ready: function () {

        var i;
        var l;
        var isError = false;
        var length = this._tasks.length;
        var result = [];

        this._pending += 1;

        if ( 1 === this._pending ) {
            this.emit('sys:pending');
        }

        function done (err) {
            this._pending -= 1;

            if ( 2 > arguments.length ) {
                this.emit('sys:error', err);

                return;
            }

            if ( 0 === this._pending ) {
                this.emit('sys:ready');

                while ( this._pends.length ) {
                    this._handle(this._pends.shift());
                }
            }
        }

        function ready (i) {
            this._tasks[i].done(function (err, res) {

                if ( 2 > arguments.length ) {
                    isError = true;
                    done.call(this, err);

                    return;
                }

                length -= 1;
                result[i] = res;

                if ( 0 === length ) {
                    done.call(this, null, result);
                }

            }, this);
        }

        for ( i = 0, l = length; i < l; i += 1 ) {

            if ( isError ) {

                break;
            }

            ready.call(this, i);
        }
    },

    /**
     * @public
     * @memberOf {Framework}
     * @method
     * */
    schedule: function () {
        [].forEach.call(arguments, function (plugin) {
            plugin = new Task(plugin, this);
            this._tasks.push(plugin);
        }, this);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Function} func
     * @param {Runtime} track
     * @param {Bundle} bundle
     * @param {Function} done
     * */
    _call: function (func, track, bundle, done) {

        if ( 'function' === typeof func ) {
            caller.callFunc(func, [track, bundle.errors, bundle.result], done);

            return;
        }

        if ( 2 === caller.callRet(func, done) ) {

            return;
        }

        //  примитивы сразу резолвим
        done(null, func);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @returns {Nested}
     * */
    _createBundle: function () {

        return new Nested();
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @returns {Runtime}
     * */
    _createTrack: function (req, res) {

        return new Runtime(this, req, res);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Runtime} track
     * */
    _handle: function (track) {

        if ( this._toobusy.busy() ) {
            track.send(503);

            return;
        }

        if ( 0 === this._pending ) {
            Framework.parent._handle.apply(this, arguments);

            return;
        }

        this._pends.push(track);
    }

});

module.exports = Framework;
