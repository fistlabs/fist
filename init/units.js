'use strict';

var R_DASHED = /[-\s]+([^-\s])/g;
var Path = require('path');

var forEach = require('fist.lang.foreach');
var glob = require('../util/glob');

/**
 * @param {Function} done
 *
 * @this {Fist}
 * */
exports = module.exports = function (done) {

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
                decl = exports.createDecl(files[i], this.params);
            } catch (ex) {
                done.call(this, ex);

                return;
            }

            decls[decls.length] = decl;
        }

        forEach(decls, function (args) {
            this.decl.apply(this, args);
        }, this);

        done.call(this, null, decls);
    }

    glob.call(this, this.params.action, onread);
};

exports.isCap = function (s) {

    return s.toUpperCase() === s;
};

exports.undash = function (s) {

    return s.replace(R_DASHED, function ($0, $1) {

        return $1.toUpperCase();
    });
};

exports.toCamel = function (s) {

    var buf;
    var i;
    var l;

    s = exports.undash(s);

    //  data - > data
    if ( !exports.isCap(s.charAt(0)) ) {

        return s;
    }

    //  DATA - > data
    if ( exports.isCap(s) ) {

        return s.toLowerCase();
    }

    //  Data - > data
    if ( !exports.isCap(s.charAt(1)) ) {

        return s.charAt(0).toLowerCase() + s.slice(1);
    }

    //  HTTPData - > httpData

    buf = '';

    for ( i = 0, l = s.length; i < l; i += 1 ) {

        if ( exports.isCap(s.charAt(i + 1)) ) {

            continue;
        }

        buf = s.slice(0, i).toLowerCase() + s.slice(i);

        break;
    }

    return buf;
};

exports.createDecl = function (filename, params) {

    var body;
    var decl = require(filename);

    if ( 'function' === typeof decl ) {
        decl = new decl(params);
    }

    body = decl.data;

    if ( 'function' === typeof body ) {
        body = body.bind(decl);
    }

    filename = exports.toCamel(Path.basename(filename, '.js'));

    return [filename, decl.deps, body];
};
