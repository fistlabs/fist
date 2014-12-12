'use strict';

var Obus = require('obus');

function Context(logger) {
    this.logger = logger;
    this.params = {};
    this.errors = new Obus();
    this.result = new Obus();
}

Context.prototype = {
    constructor: Context,
    r: function (path, def) {
        return Obus.get(this.result, path, def);
    },
    e: function (path, def) {
        return Obus.get(this.errors, path, def);
    },
    param: function (path, def) {
        return Obus.get(this.params, path, def);
    }
};

module.exports = Context;
