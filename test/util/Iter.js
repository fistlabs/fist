'use strict';

var Gen = require('./Gen');

var Iter = Gen.extend({

    constructor: function (values) {
        Iter.Parent.apply(this, values);
        this._cur = 0;
        this._values = values;
    },

    _getNext: function () {
        var res = this._values[this._cur];
        this._cur += 1;

        return res;
    },

    _isFinished: function () {
        return this._cur >= this._values.length;
    }

});

module.exports = Iter;
