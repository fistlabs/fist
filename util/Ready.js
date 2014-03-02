'use strict';

var Path = require('path');
var Task = /** @type Task */ require('fist.util.task/Task');

var multiglob = require('./multiglob');
var toArray = require('fist.lang.toarray');

/**
 * @class Ready
 * @extends Task
 * */
var Ready = Task.extend(/** @lends Ready */ {

    /**
     * @protected
     * @memberOf {Ready}
     * @method
     *
     * @constructs
     *
     * @param {Object} params
     * */
    constructor: function (params) {
        Ready.Parent.call(this, this._ready, this, params);
    },

    /**
     * @protected
     * @memberOf {Ready}
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
     * @memberOf {Ready}
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

        return [Ready.toCamel(Path.basename(filename, '.js')), decl.deps, data];
    }

}, {

    isCap: function (s) {

        return s.toUpperCase() === s;
    },

    toCamel: function (s) {

        var buf;
        var i;
        var l;

        //  data - > data
        if ( !Ready.isCap(s.charAt(0)) ) {

            return s;
        }

        //  DATA - > data
        if ( Ready.isCap(s) ) {

            return s.toLowerCase();
        }

        //  Data - > data
        if ( !Ready.isCap(s.charAt(1)) ) {

            return s.charAt(0).toLowerCase() + s.slice(1);
        }

        //  HTTPData - > httpData

        buf = '';

        for ( i = 0, l = s.length; i < l; i += 1 ) {

            if ( Ready.isCap(s.charAt(i + 1)) ) {

                continue;
            }

            buf = s.slice(0, i).toLowerCase() + s.slice(i);

            break;
        }

        return buf;
    }
});

module.exports = Ready;
