'use strict';

var Base = require('parent/Base');

var Gen = Base.extend({

    constructor: function () {
        this._running = false;
    },

    _getNext: function () {

        return Math.random();
    },

    _isFinished: function () {

        return false;
    },

    next: function () {

        if ( this._isFinished() ) {

            throw 'ALREADY_FINISHED';
        }

        if ( this._running ) {

            throw 'ALREADY RUNNING';
        }

        this._running = true;

        var ret = {
            value: this._getNext(),
            done: this._isFinished()
        };

        this._running = false;

        return ret;
    },

    'throw': function (val) {
        this._running = true;

        throw val;
    }

});

module.exports = Gen;
