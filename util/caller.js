'use strict';

var Raw = /** @type Raw */ require('../parser/Raw');
var _ = /** @type _ */ require('lodash');

exports.callYield = function (value, done) {

    if ( exports.callRet.call(this, value, done) ) {

        return;
    }

    exports.callObj.call(this, value, done);
};

exports.callRet = function (val, done, asis) {

    if ( Object(val) === val ) {

        if ( 'function' === typeof val ) {
            exports.callFunc.call(this, val, [], done);

            return true;
        }

        if ( 'function' === typeof val.next &&
             'function' === typeof val.throw ) {
            exports.callGen.call(this, val, void 0, false, done);

            return true;
        }

        if ( 'function' === typeof val.pipe ) {
            exports.callStream.call(this, val, done);

            return true;
        }

        try {

            if ( 'function' === typeof val.then ) {
                exports.callPromise.call(this, val, done);

                return true;
            }

        } catch (err) {
            done.call(this, err);

            return true;
        }

        if ( asis ) {
            done.call(this, null, val);

            return true;
        }

        return false;
    }

    done.call(this, null, val);

    return true;
};

exports.callFunc = function (func, args, done) {

    var called = false;

    function resolve () {

        if ( called ) {

            return;
        }

        called = true;

        done.apply(this, arguments);
    }

    //  Необходимо скопировать свойства функции, не нравится мне это!
    _.extend(resolve, done);
    args = args.concat(resolve);

    if ( 'GeneratorFunction' === func.constructor.name ) {
        exports.callGenFn.call(this, func, args, done);

        return;
    }

    func = func.apply(this, args);

    if ( called || void 0 === func ) {

        return;
    }

    called = true;

    exports.callRet.call(this, func, done, true);
};

exports.callGenFn = function (func, args, done) {
    func = func.apply(this, args);
    exports.callGen.call(this, func, void 0, false, done);
};

exports.callGen = function (gen, result, isError, done) {

    try {
        result = isError ? gen.throw(result) : gen.next(result);
    } catch (err) {
        done.call(this, err);

        return;
    }

    if ( result.done ) {
        exports.callYield.call(this, result.value, done);

        return;
    }

    exports.callYield.call(this, result.value, function (err, res) {

        if ( 1 === arguments.length ) {
            exports.callGen.call(this, gen, err, true, done);

            return;
        }

        exports.callGen.call(this, gen, res, false, done);
    });
};

exports.callObj = function (obj, done) {

    var isError;
    var keys = _.keys(obj);
    var klen = keys.length;
    var result = Array.isArray(obj) ? [] : {};

    if ( 0 === klen ) {
        done.call(this, null, result);

        return;
    }

    isError = false;

    _.forOwn(keys, function (i) {

        function onReturned (err, res) {

            if ( isError ) {

                return;
            }

            if ( 1 === arguments.length ) {
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

        exports.callRet.call(this, obj[i], onReturned, true);
    }, this);
};

exports.callPromise = function (promise, done) {

    try {
        promise.then(function (res) {
            done.call(this, null, res);
        }, done, this);

    } catch (err) {
        done.call(this, err);
    }

};

exports.callStream = function (stream, done) {
    new Raw().parse(stream).done(done, this);
};
