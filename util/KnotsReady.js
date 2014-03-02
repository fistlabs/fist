'use strict';

var Path = require('path');
var Task = /** @type Task */ require('fist.util.task/Task');

var camelize = require('./camelize');
var multiglob = require('./multiglob');
var toArray = require('fist.lang.toarray');

/**
 * @class KnotsReady
 * @extends Task
 * */
var KnotsReady = Task.extend(/** @lends KnotsReady */ {

    /**
     * @protected
     * @memberOf {KnotsReady}
     * @method
     *
     * @constructs
     *
     * @param {Object} params
     * */
    constructor: function (params) {
        KnotsReady.Parent.call(this, this._ready, this, params);
    },

    /**
     * @protected
     * @memberOf {KnotsReady}
     * @method
     *
     * @param {Object} params
     * @param {Function} done
     * */
    _ready: function (params, done) {

        var decls = [];

        multiglob.call(this, toArray(params.action), function (err, files) {

            var decl;
            var i;
            var l;

            if ( 2 > arguments.length ) {
                done.call(this, err);

                return;
            }

            for ( i = 0, l = files.length; i < l; i += 1 ) {

                try {
                    decl = this._createDecl(files[i], params);
                } catch (ex) {
                    done.call(this, ex);

                    return;
                }

                decls[decls.length] = decl;
            }

            done.call(this, null, decls);
        });
    },

    /**
     * @protected
     * @memberOf {KnotsReady}
     * @method
     *
     * @param {String} filename
     * @param {Object} params
     *
     * @returns {Object}
     * */
    _createDecl: function (filename, params) {

        var decl = require(filename);
        var data;

        if ( 'function' === typeof decl ) {
            decl = new decl(params);
        }

        data = decl.data;

        if ( 'function' === typeof data ) {
            data = data.bind(decl);
        }

        return [camelize(Path.basename(filename, '.js')), decl.deps, data];
    }
});

module.exports = KnotsReady;
