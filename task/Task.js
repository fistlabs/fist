'use strict';

var Base = /** @type Base */ require('fist.lang.class/Base');

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
        args[args.length] = this._done.bind(this);

        /**
         * @public
         * @memberOf {Task}
         * @property {Array}
         * */
        this.args = args;

        /**
         * @public
         * @memberOf {Task}
         * @property {Array}
         * */
        this.clbs = [];

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

        /**
         * @public
         * @memberOf {Task}
         * @property {Array|Arguments}
         * */
        this.rest = [];

        /**
         * @public
         * @memberOf {Task}
         * @property {Number}
         * */
        this.stat = -1;
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

        if ( 1 === this.stat ) {
            done.apply(ctxt, this.rest);

            return;
        }

        this.clbs.push([done, ctxt]);

        if ( 0 === this.stat ) {

            return;
        }

        this.stat = 0;

        this.func.apply(this.ctxt, this.args);
    },

    /**
     * @protected
     * @memberOf {Task}
     * @method
     * */
    _done: function () {

        var i;
        var l;

        if ( 1 === this.stat ) {

            return;
        }

        this.rest = arguments;
        this.stat = 1;

        for ( i = 0, l = this.clbs.length; i < l; i += 1 ) {
            this.clbs[i][0].apply(this.clbs[i][1], this.rest);
        }

        this.clbs = [];
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
