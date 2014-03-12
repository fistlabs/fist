'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');
var Next = /** @type Next */ require('./Next');
var toArray = require('fist.lang.toarray');

/**
 * @class Task
 * @extends Base
 * */
var Task = Base.extend(/** @lends Task.prototype */ {

    /**
     * @protected
     * @memberOf {Task}
     * @method
     *
     * @constructs
     *
     * @param {Function} func
     * @param {*} [ctxt]
     * @param {*} [args]
     * */
    constructor: function (func, ctxt, args) {

        /**
         * @public
         * @memberOf {Task}
         * @property {Array}
         * */
        this.args = toArray(args);

        /**
         * @public
         * @memberOf {Task}
         * @property {*}
         * */
        this.ctxt = ctxt;

        /**
         * @public
         * @memberOf {Task}
         * @property {Function}
         * */
        this.func = func;
    },

    /**
     * @protected
     * @memberOf {Task}
     * @method
     *
     * @param {Function} done   callback(resp)
     * @param {*} [ctxt]
     * */
    done: function (done, ctxt) {

        var next = this._next;

        if ( !(next instanceof Next )) {
            next = this._next = new Next();

            this.func.apply(this.ctxt, this.args.concat(function () {
                next.args(arguments);
            }));
        }

        next.done(done, ctxt);
    }

});

module.exports = Task;
