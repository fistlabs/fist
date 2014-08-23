'use strict';

var EventEmitter = require('events').EventEmitter;

function Parted (parts) {
    EventEmitter.apply(this, arguments);

    function call () {

        var part;

        if ( 0 === parts.length ) {
            this.emit('end');

            return;
        }

        part = parts.shift();

        setTimeout(function () {
            this.emit('data', part);
            call.call(this);
        }.bind(this), 0);
    }

    this.on('newListener', function newListener (type) {

        if ( 'data' === type ) {
            call.call(this);
            this.removeListener('newListener', newListener);
        }
    });
}

Parted.prototype = Object.create(EventEmitter.prototype);

Parted.prototype.pipe = function (w) {
    this.on('data', function (c) {
        w.write(c);
    });
    this.on('end', function () {
        w.end();
    });
};

module.exports = Parted;
