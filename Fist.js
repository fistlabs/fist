'use strict';

var Ready = /** @type Ready */ require('./util/Ready');
var Runtime = /** @type Runtime */ require('./Runtime');
var Server = /** @type Server */ require('fist.io.server/Server');
var StreamLoader = /** @type StreamLoader */
    require('fist.util.streamloader/StreamLoader');

var forEach = require('fist.lang.foreach');
var toArray = require('fist.lang.toarray');

/**
 * @class Fist
 * @extends Server
 * */
var Fist = Server.extend(/** @lends Fist.prototype */ {

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Fist.Parent.apply(this, arguments);

        this.router.addRoutes(toArray(this.params.routes));

        /**
         * @protected
         * @memberOf {Fist}
         * @property {Ready}
         * */
        this._ready = new Ready(this.params);

        //  Если запросы начали посылать пока узлы не проинициализировались
        this._handle = function (track) {
            this.ready(function () {

                delete this._handle;
                this._handle(track);
            });
        };
    },

    /**
     * @public
     * @memberOf {Fist}
     * @method
     * */
    listen: function () {
        Fist.parent.listen.apply(this, arguments);

        this.ready(function (err, decls) {
            forEach(decls, function (args) {
                this.decl.apply(this, args);
            }, this);
        });
    },

    /**
     * @public
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} done
     * */
    ready: function (done) {
        this._ready.done(done, this);
    },

    /**
     * @protected
     * @memberOf {Fist}
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
     * @memberOf {Fist}
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
     * @memberOf {Fist}
     * @method
     *
     * @param {Object} gen
     * @param {*} result
     * @param {Boolean} isError
     * @param {Function} done
     * */
    _callGen: function (gen, result, isError, done) {

        var tracker = this;

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

        this._callYield(result.value, function () {

            var stat = +(1 < arguments.length);

            tracker._callGen(gen, arguments[stat], !stat, done);
        });
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {*} value
     * @param {Function} done
     * */
    _callYield: function (value, done) {

        switch ( this._callRet(value, done) ) {

            //  вызова не было, примитив
            case 0: {
                done(null, value);

                break;
            }

            //  вызова не было, объект
            case 1: {
                this._callObj(value, done);

                break;
            }

            default: {

                //  был вызов
                break;
            }
        }
    },

    /**
     * @protected
     * @memberOf {Fist}
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
     * @memberOf {Fist}
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
     * @memberOf {Fist}
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
     * @memberOf {Fist}
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

        forEach(keys, function (i) {

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
     * @memberOf {Fist}
     * @method
     *
     * @param {Readable} readable
     * @param {Function} done
     * */
    _callStream: function (readable, done) {
        ( new StreamLoader(readable) ).done(done);
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @returns {Runtime}
     * */
    _createTrack: function (req, res) {

        return new Runtime(this, req, res);
    }

});

module.exports  = Fist;
