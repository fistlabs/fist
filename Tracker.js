'use strict';

var Bundle = /** @type Bundle */ require('./bundle/Bundle');
var Class = /** @type Class */ require('fist.lang.class/Class');
var Emitter = /** @type EventEmitter */ require('events').EventEmitter;
var Task = /** @type Task */ require('./task/Task');

var toArray = require('fist.lang.toarray');

function ENOUNIT (done) {
    done.call(this);
}

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

        } else {
            deps = toArray(deps);
        }

        this.decls[path] = {
            deps: deps,
            body: body
        };

        return this;
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {String} name
     * @param {*} [event]
     * */
    emitEvent: function (name, event) {
        this.emit(name, event);
    },

    /**
     * @public
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {String} path
     * @param {Function} done done(resp)
     * */
    resolve: function (track, path, done) {

        var task;

        //  already has task
        if ( path in track.tasks ) {
            track.tasks[path].done(done, this);

            return;
        }

        if ( path in this.decls ) {
            task = new Task(this._pend, this, [track, this.decls[path]]);

        } else {
            task = new Task(ENOUNIT, this, []);
        }

        //  cache task
        track.tasks[path] = task;

        task.done(done, this);
    },

    /**
     * @protected
     * @memberOf {Tracker}
     * @method
     *
     * @param {Track} track
     * @param {Array<String>|String} deps
     * @param {Function} done done(bundle)
     * */
    _bundle: function (track, deps, done) {

        var bundle = this._createBundle();
        var length = deps.length;

        if ( 0 === length ) {
            done.call(this, bundle);

            return;
        }

        deps.forEach(function (path) {
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
        body.call(track, bundle, done);
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
