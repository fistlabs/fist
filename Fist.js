'use strict';

var Path = require('path');
var Server = /** @type Server */ require('fist.io.server/Server');
var Task = /** @type Task */ require('fist.util.task/Task');
var Runtime = require('./Runtime');

var camelize = require('./util/camelize');
var forEach = require('fist.lang.foreach');
var readdir = require('./util/readdir');
var readdirs = require('./util/readdirs');
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

        if ( 'function' === typeof func ) {

            return func(track, bundle.result, done, bundle.errors, bundle);
        }

        return done(null, func);
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

        function onReadDirs (err, dirs) {

            if ( 2 > arguments.length ) {

                return done.call(this, err);
            }

            function processDir (dirlist) {

                function processList (filename) {

                    var data;
                    var orig = require( Path.join(dirlist.name, filename) );

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

                dirlist.list.forEach(processList, this);
            }

            dirs.forEach(processDir, this);

            return done.call(this, null, result);
        }

        readdirs.call(this, toArray(this.params.action), onReadDirs);
    }

});

module.exports  = Fist;
