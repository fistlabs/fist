'use strict';

var Path = require('path');
var Server = /** @type Server */ require('fist.io.server/Server');
var Task = /** @type Task */ require('fist.util.task/Task');

var camelize = require('./util/camelize');
var forEach = require('fist.lang.foreach');
var readdir = require('./util/readdir');
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

        /**
         * @public
         * @memberOf {Fist}
         * @method
         *
         * @param {}
         * */
        this._ready = new Task(this._init, this);
    },

    /**
     * @public
     * @memberOf {Fist}
     * @method
     *
     * @param {Activity} track
     * */
    _handle: function (track) {
        var args = arguments;
        this._ready.done(function (err, res) {

            if ( 2 > arguments.length ) {
                setTimeout(function () {

                    throw err;
                }, 0);
            }

            Fist.Parent.prototype._handle.apply(this, args);
        }, this);
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
        func(track, bundle.result, done, bundle.errors);
    },

    /**
     * @protected
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} done
     * */
    _init: function (done) {
        this._declsInit(function () {

            var routerConf = require(this.params.conf);

            routerConf.forEach(function (route) {
                this.route(route.verb, route.expr, route.data);
            }, this);

            done.apply(this, arguments);
        });
    },

    /**
     * @public
     * @memberOf {Fist}
     * @method
     *
     * @param {Function} done
     * */
    _declsInit: function (done) {
        this._declsCreate(this.params, function (err, decls) {

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
     * @param {Object} params
     * @param {Function} done
     * */
    _declsCreate: function (params, done) {

        var count;
        var isError = false;
        var result = Object.create(null);
        var dirs = /** @type {Array} */ toArray(params.dirs);

        count = dirs.length;

        if ( 0 === count ) {
            done.call(this, null, result);

            return;
        }

        function read (err, list) {

            if ( isError ) {

                return;
            }

            if ( 2 > arguments.length ) {
                isError = true;

                done.call(this, err);

                return;
            }

            list.forEach(function (filename) {

                var data;
                var name = Path.basename(filename, '.js');
                var action = require(filename);

                if ( 'function' === typeof action ) {

                    action = new action(params);
                }

                data = action.data;

                if ( 'function' === typeof data ) {
                    data = data.bind(action);
                } else {
                    data = function (track, result, done) {
                        done(null, action.data);
                    };
                }

                name = camelize(name);

                result[name] = {
                    deps: action.deps,
                    data: data
                };

            }, this);

            count -= 1;

            if ( 0 === count ) {
                done.call(this, null, result);
            }

        }

        dirs.forEach(function (dir) {
            readdir(dir, read, this);
        }, this);
    }

});

module.exports  = Fist;
