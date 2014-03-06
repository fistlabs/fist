'use strict';

var Path = require('path');
var Task = /** @type Task */ require('fist.util.task/Task');

var forEach = require('fist.lang.foreach');
var glob = require('glob');
var toArray = require('fist.lang.toarray');

/**
 * @class Ready
 * @extends Task
 * */
var Ready = Task.extend(/** @lends Ready.prototype */ {

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
        Ready.Parent.call(this, this._ready, this, [params]);
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

        function onread (err, files) {

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
        }

        Ready.multiglob.call(this, toArray(params.action), onread);
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

        var body;
        var decl = require(filename);

        if ( 'function' === typeof decl ) {
            decl = new decl(params);
        }

        body = decl.data;

        if ( 'function' === typeof body ) {
            body = body.bind(decl);
        }

        return [Ready.toCamel(Path.basename(filename, '.js')), decl.deps, body];
    }

}, {

    /**
     * @public
     * @static
     * @memberOf Ready
     * @method
     *
     * @param {String} s
     *
     * @returns {Boolean}
     * */
    isCap: function (s) {

        return s.toUpperCase() === s;
    },

    /**
     * @public
     * @static
     * @memberOf Ready
     * @method
     *
     * @param {String} s
     *
     * @returns {String}
     * */
    toCamel: function (s) {

        var buf;
        var i;
        var l;

        s = Ready.convert(s);

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
    },

    /**
     * @public
     * @static
     * @memberOf Ready
     * @method
     *
     * @param {String} s
     *
     * @returns {String}
     * */
    convert: function (s) {

        return s.replace(/[-\s]+([^-\s])/g, function ($0, $1) {

            return $1.toUpperCase();
        });
    },

    /**
     * @public
     * @static
     * @memberOf Ready
     *
     * @method
     *
     * @param {String} expr
     * @param {Function} done
     * */
    glob: function (expr, done) {

        try {
            glob(expr, done.bind(this));

        } catch (err) {
            done.call(this, err);
        }
    },

    /**
     * @public
     * @static
     * @memberOf Ready
     *
     * @method
     *
     * @param {String} exprs
     * @param {Function} done
     * */
    multiglob: function (exprs, done) {

        var result = [];
        var files = [];
        var reject = false;
        var count = exprs.length;

        if ( 0 === count ) {
            done.call(this, null, result);

            return;
        }

        function merge (list) {
            [].push.apply(files, list);
        }

        function eachPath (name, i) {

            function onread (err, list) {

                if ( reject ) {

                    return;
                }

                if ( 2 > arguments.length ) {
                    reject = true;
                    done.call(this, err);

                    return;
                }

                result[i] = list;

                count -= 1;

                if ( 0 === count ) {
                    forEach(result, merge);
                    done.call(this, null, files);
                }
            }

            Ready.glob.call(this, name, onread);
        }

        forEach(exprs, eachPath, this);
    }
});

module.exports = Ready;
