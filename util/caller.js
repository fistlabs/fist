'use strict';

var Loader = /** @type Loader */ require('../parser/Loader');

exports.callPromise = function (promise, done) {

    try {

        promise.then(function (res) {
            done(null, res);
        }, done);

    } catch (err) {
        done(err);
    }

};

exports.callRet = function (val, done) {

    if ( Object(val) === val ) {

        if ( 'function' === typeof val ) {
            exports.callFunc(val, [], done);

            return 2;
        }

        if ( 'function' === typeof val.next &&
             'function' === typeof val.throw ) {
            exports.callGen(val, void 0, false, done);

            return 2;
        }

        if ( 'function' === typeof val.pipe ) {
            exports.callStream(val, done);

            return 2;
        }

        try {

            if ( 'function' === typeof val.then ) {
                exports.callPromise(val, done);

                return 2;
            }

        } catch (err) {
            done(err);

            return 2;
        }

        return 1;
    }

    return 0;
};

exports.callGenFn = function (func, args, done) {
    func = func.apply(this, args);
    exports.callGen(func, void 0, false, done);
};

exports.callGen = function (gen, result, isError, done) {

    try {
        result = isError ? gen.throw(result) : gen.next(result);
    } catch (err) {
        done(err);

        return;
    }

    if ( result.done ) {
        exports.callYield(result.value, done);

        return;
    }

    exports.callYield(result.value, function (err, res) {

        if ( 2 > arguments.length ) {
            exports.callGen(gen, err, true, done);

            return;
        }

        exports.callGen(gen, res, false, done);
    });
};

exports.callFunc = function (func, args, done) {

    var called = false;

    args = args.concat(function () {

        if ( called ) {

            return;
        }

        called = true;
        done.apply(this, arguments);
    });

    if ( 'GeneratorFunction' === func.constructor.name ) {
        exports.callGenFn(func, args, done);

        return;
    }

    func = func.apply(this, args);

    if ( called || void 0 === func ) {

        return;
    }

    called = true;

    if ( 2 === exports.callRet(func, done) ) {

        return;
    }

    done(null, func);
};

exports.callYield = function (value, done) {
    /*eslint no-fallthrough: 0*/
    switch ( exports.callRet(value, done) ) {

        //  вызова не было, примитив
        case 0: {
            done(null, value);

            break;
        }

        //  вызова не было, объект
        case 1: {
            exports.callObj(value, done);

            break;
        }

        default: {

            //  был вызов
            break;
        }
    }
};

exports.callObj = function (obj, done) {

    var isError;
    var keys = Object.keys(obj);
    var klen = keys.length;
    var result = Array.isArray(obj) ? [] : {};

    if ( 0 === klen ) {
        done(null, result);

        return;
    }

    isError = false;

    keys.forEach(function (i) {

        function onReturned (err, res) {

            if ( isError ) {

                return;
            }

            if ( 2 > arguments.length ) {
                isError = true;
                done(err);

                return;
            }

            result[i] = res;
            klen -= 1;

            if ( 0 === klen ) {
                done(null, result);
            }
        }

        if ( 2 === exports.callRet(obj[i], onReturned) ) {

            return;
        }

        onReturned.call(this, null, obj[i]);
    }, this);
};

exports.callStream = function (readable, done) {
    new Loader(readable, null).done(done, this);
};
