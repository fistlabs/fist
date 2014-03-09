'use strict';

var Emitter = require('events').EventEmitter;

function Parted (parts) {
    Emitter.apply(this, arguments);

    this.on('newListener', function newListener (type) {

        if ( 'data' === type ) {
            setTimeout(function () {
                parts.forEach(function (part) {
                    this.emit('data', part);
                }, this);
                this.emit('end');
            }.bind(this), 0);

            this.removeListener('newListener', newListener);
        }
    });
}

Parted.prototype = Object.create(Emitter.prototype);

Parted.prototype.pipe = function (w) {
    this.on('data', function (c) {
        w.write(c);
    });
    this.on('end', function () {
        w.end();
    });
};

module.exports = Parted;
