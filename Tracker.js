'use strict';

var Bundle = /** @type Bundle */ require('./bundle/Bundle');
var Class = /** @type Class */ require('fist.lang.class/Class');
var Emitter = /** @type EventEmitter */ require('events').EventEmitter;
var Next = /** @type Next */ require('fist.util.next/Next');

var toArray = require('fist.lang.toarray');
var _ = /** @type _ */ require('lodash');

/**
 * @abstract
 * @class Tracker
 * @extends EventEmitter
 * @extends Class
 * */
var Tracker = Class.extend.call(Emitter, /** @lends Tracker.prototype */ {

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @constructs
     * */
    constructor: function () {
        Class.apply(this, arguments);
        Tracker.Parent.apply(this, arguments);

        /**
         * @public
         * @memberOf {Tracker}
         * @property {Object}
         * */
        this.decls = Object.create(null);
    },

    /**
     * Декларирует узел
     *
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {*} [deps]
     * @param {Function} [body]
     *
     * @returns {Tracker}
     * */
    decl: function (path, deps, body) {

        if ( 3 > arguments.length ) {
            body = deps;
            deps = [];
        }

        return this.unit(path, {
            deps: deps,
            body: body
        });
    },

    /**
     * Запускает операцию разрешения узла
     *
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {*} done
     * */
    resolve: function (track, path, done) {

        var next;

        if ( path in track.tasks ) {
            track.tasks[path].done(done, this);

            return;
        }

        next = track.tasks[path] = new Next();
        next.done(done, this);

        done = this._createResolver(path, next);

        if ( path in this.decls ) {
            this._pend(track, this.decls[path], done);

            return;
        }

        done.reject();
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {Object} unit
     *
     * @returns {Tracker}
     * */
    unit: function (path, unit) {
        unit = Object(unit);

        if ( this._checkDeps(path, unit) ) {
            this.decls[path] = unit;

            return this;
        }

        throw new ReferenceError(path);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Array<String>} deps
     * @param {Function} done done(bundle)
     * */
    _bundle: function (track, deps, done) {

        var bundle;
        var length;

        deps = toArray(deps);
        bundle = this._createBundle();
        length = deps.length;

        if ( 0 === length ) {
            done.call(this, bundle);

            return;
        }

        //  Здесь for-each а не просто цикл
        // потому что нужно замыкание `path`
        _.forEach(deps, function (path) {
            this.resolve(track, path, function () {
                bundle.bundlify(path, arguments);
                length -= 1;

                if ( 0 === length ) {
                    done.call(this, bundle);
                }
            });
        }, this);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Function} body
     * @param {Track} track
     * @param {Bundle} bundle
     * @param {Function} done
     * */
    _call: function (body, track, bundle, done) {
        body.call(this, track, bundle.errors, bundle.result, done);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {Object} unit
     *
     * @returns {Boolean}
     * */
    _checkDeps: function (path, unit) {

        var deps = /** @type {Array} */ toArray(unit.deps);
        var l = deps.length;

        while ( l ) {
            l -= 1;

            if ( path === deps[l] ) {

                return false;
            }

            unit = this.decls[deps[l]];

            if ( void 0 === unit || this._checkDeps(path, unit) ) {

                continue;
            }

            return false;
        }

        return true;
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @returns {Bundle}
     * */
    _createBundle: function () {

        return new Bundle();
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} path
     * @param {Next} next
     *
     * @returns {Function}
     * */
    _createResolver: function (path, next) {

        var date = new Date();
        var self = this;

        function trigger (name, data) {
            self.emit(name, {
                path: path,
                time: new Date() - date,
                data: data
            });
        }

        function done (err, res) {

            if ( 2 > arguments.length ) {
                done.reject(err);

                return;
            }

            done.accept(res);
        }

        done.accept = function (data) {
            trigger('sys:accept', data);
            next.resolve(null, data);
        };

        done.notify = function (data) {
            trigger('sys:notify', data);
        };

        done.reject = function (data) {
            trigger('sys:reject', data);
            next.resolve(data);
        };

        return done;
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Object} decl
     * @param {Function} done
     * */
    _pend: function (track, decl, done) {
        this._bundle(track, decl.deps, function (bundle) {
            this._call(decl.body, track, bundle, done);
        });
    }

});

module.exports = Tracker;
