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

        this._router.addRoutes(toArray(this.params.routes));

        /**
         * @protected
         * @memberOf {Fist}
         * @property {Task}
         * */
        this._ready = new Task(this._init, this);

        this._handle = function (track) {
            this._ready.done(function (err, res) {

                if ( 2 > arguments.length ) {
                    setTimeout(function () {
                        throw err;
                    }, 0);

                } else {
                    Fist.Parent.prototype._handle.call(this, track);
                }

                delete this._handle;
            }, this);
        };
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

        var action = /** @type {Array} */ toArray(this.params.action);
        var actlen;
        var reject = false;
        var result = Object.create(null);

        actlen = action.length;

        if ( 0 === actlen ) {
            done.call(this, null, result);

            return;
        }

        function read (err, list) {

            if ( reject ) {

                return;
            }

            if ( 2 > arguments.length ) {
                reject = true;
                done.call(this, err);

                return;
            }

            list.forEach(function (filename) {

                var data;
                var orig = require(filename);

                if ( 'function' === typeof orig ) {

                    orig = new orig(this.params);
                }

                data = orig.data;

                if ( 'function' === typeof data ) {
                    data = data.bind(orig);

                } else {
                    data = function (track, result, done) {
                        done(null, orig.data);
                    };
                }

                result[camelize(Path.basename(filename, '.js'))] = {
                    deps: orig.deps,
                    data: data
                };

            }, this);

            actlen -= 1;

            if ( 0 === actlen ) {
                done.call(this, null, result);
            }
        }

        action.forEach(function (dirname) {
            readdir(dirname, read, this);
        }, this);
    }

});

module.exports  = Fist;
