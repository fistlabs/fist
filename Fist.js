'use strict';

var Path = require('path');
var StreamLoader = /** @type StreamLoader */
    require('fist.util.streamloader/StreamLoader');
var Server = /** @type Server */ require('fist.io.server/Server');
var Task = /** @type Task */ require('fist.util.task/Task');
var Runtime = require('./Runtime');
var Connect = require('fist.io.server/track/Connect');

var camelize = require('./util/camelize');
var forEach = require('fist.lang.foreach');
var multiglob = require('./util/multiglob');
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
         * @property {Task} задача на инициализацию приложения по требованию
         * */
        this._ready = new Task(this._init, this);

        //  Сервер начинает отвечать сразу, но первые запросы выволнятся только
        // после того как будут проинициализированы узлы
        this._handle = function (track) {
            this.ready(function () {
                //  Метод уже удален из тела, остался только метод прототипа
                this._handle.call(this, track);
            });
        };
    },

    ready: function (done) {
        this._ready.done(done, this);
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} func
     * @param {Activity} track
     * @param {Bundle} bundle
     * @param {Function} done
     * */
    _call: function (func, track, bundle, done) {

        var resolve;
        var result;
        var returned;
        var sent;

        //  тело датапровайдера может быть разного типа
        //  общий случай - функция
        if ( 'function' === typeof func ) {

            returned = false;

            resolve = function () {

                if ( returned ) {

                    return;
                }

                returned = true;

                done.apply(this, arguments);
            };

            sent = function () {

                return track.send === Connect.noop || returned;
            };

            //  Может быть даже генератор
            if ( 'GeneratorFunction' === func.constructor.name ) {
                result = [track, bundle.errors, bundle.result, resolve];
                this._callGeneratorFn(func, result, resolve, sent);

                return;
            }

            result = func(track, bundle.errors, bundle.result, resolve);

            if ( returned ) {

                return;
            }

            //  если было возвращено нечто кроме undefined
            returned = void 0 !== result;

            if ( returned ) {

                if ( 2 === this._callReturned(result, done, sent) ) {

                    return;
                }

                done.call(this, null, result);
            }

            return;
        }

        //  примитивы сразу резолвим
        done.call(this, null, func);
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} func
     * @param {Array|Arguments} args
     * @param {Function} done
     * @param {Function} sent
     * */
    _callGeneratorFn: function (func, args, done, sent) {
        func = func.apply(this, args);
        this._callGenerator(func, void 0, false, done, sent);
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
     * @param {Function} sent
     * */
    _callGenerator: function (gen, result, isError, done, sent) {

        if ( sent() ) {
            //  если данные уже были отправлены, то нет смысла
            // продолжать выполнять генератор
            return;
        }

        try {
            result = isError ? gen.throw(result) : gen.next(result);
        } catch (err) {
            done.call(this, err);

            return;
        }

        if ( result.done ) {
            this._callYieldable(result.value, done, sent);

            return;
        }

        this._callYieldable(result.value, function () {

            var stat = +(1 < arguments.length);

            this._callGenerator(gen, arguments[stat], !stat, done, sent);
        }, sent);
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {*} value
     * @param {Function} done
     * @param {Function} sent
     * */
    _callYieldable: function (value, done, sent) {

        switch ( this._callReturned(value, done, sent) ) {

            //  вызова не было, примитив
            case 0: {
                done.call(this, null, value);

                break;
            }

            //  вызова не было, объект
            case 1: {
                this._callObj(value, done, sent);

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
     * @param {Function} done
     * @param {Function} sent
     * */
    _callFunction: function (func, done, sent) {

        //  если герератор, то обрабатываем генератор
        if ( 'GeneratorFunction' === func.constructor.name ) {
            this._callGeneratorFn(func, [], done, sent);

            return;
        }

        //  иначе предполагаем thunk
        func(done.bind(this));
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {*} val
     * @param {Function} done
     * @param {Function} sent
     *
     * @returns {Number}
     * */
    _callReturned: function (val, done, sent) {

        if ( Object(val) === val ) {

            if ( 'function' === typeof val ) {
                this._callFunction(val, done, sent);

                return 2;
            }

            if ( 'function' === typeof val.next &&
                 'function' === typeof val.throw ) {
                this._callGenerator(val, void 0, false, done, sent);

                return 2;
            }

            if ( 'function' === typeof val.pipe ) {
                this._callStream(val, done);

                return 2;
            }

            //  если есть метод then, то это promise
            try {
                //  по спецификации геттер может выбросить исключение
                if ( 'function' === typeof val.then ) {
                    this._callPromise(val, done);

                    return 2;
                }
            } catch (err) {
                //  тогда надо реджектить promise c этим исключением
                done.call(this, err);

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

        var called = false;
        var tracker = this;

        function callDone () {

            if ( called ) {

                return;
            }

            called = true;

            done.apply(tracker, arguments);
        }

        try {

            promise.then(function (res) {
                callDone(null, res);
            }, callDone);

        } catch (err) {
            callDone(err);
        }
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {Object} obj
     * @param {Function} done
     * @param {Function} sent
     * */
    _callObj: function (obj, done, sent) {

        var isError;
        var keys = Object.keys(obj);
        var klen = keys.length;
        var result = Array.isArray(obj) ? [] : {};

        if ( 0 === klen ) {
            done.call(this, null, result);

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
                    done.call(this, err);

                    return;
                }

                result[i] = res;
                klen -= 1;

                if ( 0 === klen ) {
                    done.call(this, null, result);
                }
            }

            if ( 2 === this._callReturned(obj[i], onReturned, sent) ) {

                return;
            }

            onReturned.call(this, null, obj[i]);
        }, this);
    },

    _callStream: function (readable, done) {
        ( new StreamLoader(readable) ).done(done, this);
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {Object} [params]
     * @returns {Runtime}
     * */
    _createTrack: function (params) {

        return new Runtime(this, params);
    },

    /**
     * @public
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} done
     * */
    _init: function (done) {
        this._declsCreate(function (err, decls) {

            if ( 2 > arguments.length ) {

                return done.call(this, err);
            }

            forEach(decls, function (decl, path) {
                this.decl(path, decl.deps, decl.data);
            }, this);

            return done.call(this, null, null);
        });
    },

    /**
     * @public
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} done
     * */
    _declsCreate: function (done) {

        var result = Object.create(null);

        function onReadDirs (err, files) {

            if ( 2 > arguments.length ) {

                return done.call(this, err);
            }

            function processList (filename) {

                var data;
                var orig = require(filename);

                if ( 'function' === typeof orig ) {
                    orig = new orig(this.params);
                }

                data = orig.data;

                if ( 'function' === typeof data ) {
                    data = data.bind(orig);
                }

                filename = camelize(Path.basename(filename, '.js'));

                result[filename] = {
                    deps: orig.deps,
                    data: data
                };
            }

            forEach(files, processList, this);

            return done.call(this, null, result);
        }

        multiglob.call(this, toArray(this.params.action), onReadDirs);
    },

    listen: function () {
        //  запрос инициализации
        this.ready(function () {

            delete this._handle;
        });

        Fist.parent.listen.apply(this, arguments);
    }

});

module.exports  = Fist;
