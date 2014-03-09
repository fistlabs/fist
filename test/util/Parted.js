'use strict';

var Emitter = require('events').EventEmitter;

function Parted (parts) {
    Emitter.apply(this, arguments);

    this.on('newListener', function () {

        setTimeout(function () {
            parts.forEach(function (part) {
                this.emit('data', part);
            }, this);
            this.emit('end');
        }.bind(this), 0);
    });
}

Parted.prototype = Object.create(Emitter.prototype);

module.exports = Parted;
