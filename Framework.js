'use strict';

var Http = require('http');
var Loader = /** @type Loader */ require('./parser/Loader');
var Nested = /** @type Nested */ require('./bundle/Nested');
var Runtime = /** @type Runtime */ require('./track/Runtime');
var Server = /** @type Server */ require('./Server');
var Task = /** @type Task */ require('./task/Task');
var Toobusy = /** @type Toobusy */ require('./util/Toobusy');

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
    schedule: function () {
        [].forEach.call(arguments, function (plugin) {
            this._tasks.push(new Task(plugin, this));
        }, this);

        //  need we call `ready` automatically?
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

        //  поджигаем pending только если это первая инициализация
        if ( 1 === this._pending ) {
            //  сервер приостанавливает работу, откладывает запросы
            this._handle = /** @type {_handle}*/ [].push.bind(this._pends);

            //  говорим что приостановлено
            this.emit('sys:pending');

            //  когда будет готов, надо будет обработать все отложенные запросы
            this.once('sys:ready', function () {
                delete this._handle;

                while ( this._pends.length ) {
                    this._handle(this._pends.shift());
                }
            });
        }

        function done (err) {
            this._pending -= 1;

            if ( 2 > arguments.length ) {
                this.emit('sys:error', err);

                return;
            }

            //  надо поджечь событие только тогда когда все ready доделались
            if ( 0 === this._pending ) {
                this.emit('sys:ready');
            }
        }

        function taskReady (i) {
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
            //  синхронные таски могут сразу сломаться
            if ( isError ) {

                break;
            }

            taskReady.call(this, i);
        }
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
            this._callFunc(func, [track, bundle.errors, bundle.result], done);

            return;
        }

        if ( 2 === this._callRet(func, done) ) {

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
     * @param {Function} func
     * @param {Array|Arguments} args
     * @param {Function} done
     * */
    _callGenFn: function (func, args, done) {
        func = func.apply(this, args);
        this._callGen(func, void 0, false, done);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Object} gen
     * @param {*} result
     * @param {Boolean} isError
     * @param {Function} done
     * */
    _callGen: function (gen, result, isError, done) {

        var self = this;

        try {
            result = isError ? gen.throw(result) : gen.next(result);
        } catch (err) {
            done(err);

            return;
        }

        if ( result.done ) {
            this._callYield(result.value, done);

            return;
        }

        this._callYield(result.value, function (err, res) {

            if ( 2 > arguments.length ) {
                self._callGen(gen, err, true, done);

                return;
            }

            self._callGen(gen, res, false, done);
        });
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {*} value
     * @param {Function} done
     * */
    _callYield: function (value, done) {
        /*eslint no-fallthrough: 0*/
        switch ( this._callRet(value, done) ) {

            //  вызова не было, примитив
            case 0:
            {
                done(null, value);

                break;
            }

            //  вызова не было, объект
            case 1:
            {
                this._callObj(value, done);

                break;
            }

            default:
            {

                //  был вызов
                break;
            }
        }
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Function} func
     * @param {Array} args
     * @param {Function} done
     *
     * @returns {*}
     * */
    _callFunc: function (func, args, done) {

        var called = false;

        args = args.concat(function () {

            if ( called ) {

                return;
            }

            called = true;
            done.apply(this, arguments);
        });

        if ( 'GeneratorFunction' === func.constructor.name ) {
            this._callGenFn(func, args, done);

            return;
        }

        func = func.apply(this, args);

        if ( called || void 0 === func ) {

            return;
        }

        called = true;

        if ( 2 === this._callRet(func, done) ) {

            return;
        }

        done(null, func);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {*} val
     * @param {Function} done
     *
     * @returns {Number}
     * */
    _callRet: function (val, done) {

        if ( Object(val) === val ) {

            if ( 'function' === typeof val ) {
                this._callFunc(val, [], done);

                return 2;
            }

            if ( 'function' === typeof val.next &&
                 'function' === typeof val.throw ) {
                this._callGen(val, void 0, false, done);

                return 2;
            }

            if ( 'function' === typeof val.pipe ) {
                this._callStream(val, done);

                return 2;
            }

            try {

                if ( 'function' === typeof val.then ) {
                    this._callPromise(val, done);

                    return 2;
                }

            } catch (err) {
                done(err);

                return 2;
            }

            return 1;
        }

        return 0;
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Object} promise
     * @param {Function} done
     * */
    _callPromise: function (promise, done) {

        try {

            promise.then(function (res) {
                done(null, res);
            }, done);

        } catch (err) {
            done(err);
        }
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Object} obj
     * @param {Function} done
     * */
    _callObj: function (obj, done) {

        var isError;
        var keys = Object.keys(obj);
        var klen = keys.length;
        var result = Array.isArray(obj) ? [] : {};

        if ( 0 === klen ) {
            done(null, result);

            return;
        }

        isError = false;

        keys.forEach(function (i) {

            function onReturned (err, res) {

                if ( isError ) {

                    return;
                }

                if ( 2 > arguments.length ) {
                    isError = true;
                    done(err);

                    return;
                }

                result[i] = res;
                klen -= 1;

                if ( 0 === klen ) {
                    done(null, result);
                }
            }

            if ( 2 === this._callRet(obj[i], onReturned) ) {

                return;
            }

            onReturned.call(this, null, obj[i]);
        }, this);
    },

    /**
     * @protected
     * @memberOf {Framework}
     * @method
     *
     * @param {Readable} readable
     * @param {Function} done
     * */
    _callStream: function (readable, done) {
        new Loader(readable, null).done(done, this);
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

        Framework.parent._handle.apply(this, arguments);
    }

});

module.exports = Framework;
