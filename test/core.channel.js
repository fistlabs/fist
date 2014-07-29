/*global describe, it*/
'use strict';

var assert = require('chai').assert;
var EventEmitter = require('events').EventEmitter;

describe('core/channel', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var Channel = require('../core/channel');

    it('Should be an instance of EventEmitter', function () {
        var channel = new Channel();
        assert.instanceOf(channel, EventEmitter);
        assert.instanceOf(channel, Channel);
    });

    describe('.emit', function () {

        it('Should should just emit event', function (done) {
            var channel = new Channel();
            channel.on('x', function () {
                done();
            });

            channel.emit('x');
        });

        it('Should throw an async exception', function () {
            var channel = new Channel();
            var st = process.nextTick;
            process.nextTick = function (fn) {
                fn();
            };

            channel.on('x', function () {

                throw new Error();
            });

            assert.throws(function () {
                channel.emit('x');
            }, Error);

            process.nextTick = st;
        });
    });

    describe('.channel', function () {

        var channel = new Channel();

        it('Should create channel', function () {
            assert.instanceOf(channel.channel(), Channel);
        });

        it('Should not create channel a twice', function () {
            var c = channel.channel('c');
            assert.strictEqual(c, channel.channel('c'));
        });

    });

});
