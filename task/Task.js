'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');
var Next = /** @type Next */ require('./Next');

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
     * @param {*} ctxt
     * @param {Array} args
     * */
    constructor: function (func, ctxt, args) {

        /**
         * @public
         * @memberOf {Task}
         * @property {Array}
         * */
        this.args = args;

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

}, {

    /**
     * @public
     * @memberOf Task
     * @method
     *
     * @param {Array<Task>} tasks
     * @param {Function} done
     * @param {*} [ctxt]
     * */
    queue: function (tasks, done, ctxt) {

        var i = 0;
        var result = [];

        function taskDone (err, res) {

            if ( 2 > arguments.length ) {
                done.call(this, err);

                return;
            }

            result[result.length] = res;
            i += 1;

            next.call(this);
        }

        function next () {

            if ( i === tasks.length ) {
                done.call(this, null, result);

                return;
            }

            tasks[i].done(taskDone, this);
        }

        next.call(ctxt);
    }
});

module.exports = Task;
