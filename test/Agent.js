/*global describe, it*/
'use strict';

var assert = require('chai').assert;

describe('fist/Agent', function () {
    var Agent = require('../Agent');
    var Unit = require('../unit/_unit');

    it('Should be an instance of fist/Agent', function () {
        var EventEmitter = require('events').EventEmitter;
        var agent = new Agent({x: 42});
        assert.property(agent, 'params');
        assert.isObject(agent.params);
        assert.property(agent.params, 'x');
        assert.strictEqual(agent.params.x, 42);
        assert.instanceOf(agent, EventEmitter);
        assert.instanceOf(agent, Agent);
        assert.isObject(agent.units);
    });

    it('Should initialize units before ready', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a'
        });

        agent.unit({
            path: 'b'
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.instanceOf(agent.getUnit('b'), Unit);
            assert.isUndefined(agent.getUnit('c'));
            done();
        }).done();
    });

    it('Should inherit units form units', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a',
            base: 'b'
        });

        agent.unit({
            path: 'b'
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.instanceOf(agent.getUnit('b'), Unit);
            assert.instanceOf(agent.getUnit('a'), agent.units.b[0]);
            done();
        }).done();
    });

    it('Should failed while init coz base not found', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a',
            base: 'b'
        });

        agent.ready().fail(function (err) {
            assert.instanceOf(err, ReferenceError);

            done();
        }).done();
    });

    it('Should check dependencies and be ready', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a',
            deps: ['b']
        });

        agent.unit({
            path: 'b'
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.instanceOf(agent.getUnit('b'), Unit);
            done();
        }).done();
    });

    it('Should not fail if dependency not found', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a',
            deps: ['b']
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            done();
        }).done();
    });

    it('Should find deps conflict', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a',
            deps: ['b', 'd']
        });

        agent.unit({
            path: 'b',
            deps: 'c'
        });

        agent.unit({
            path: 'c',
            deps: ['a']
        });

        agent.unit({
            path: 'd',
            deps: ['b']
        });

        agent.ready().fail(function (err) {
            assert.instanceOf(err, ReferenceError);
            done();
        }).done();
    });

    it('Should init once', function () {

        var agent = new Agent();
        var promise = agent.ready();

        assert.strictEqual(promise, agent.ready());
        assert.notStrictEqual(promise, agent.ready(true));
    });

    it('Should emit "sys:ready" on init', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a'
        });

        agent.on('sys:ready', function () {
            assert.instanceOf(this.getUnit('a'), Unit);
            done();
        });

        agent.ready();
    });

    it('Should emit "sys:eready" on init error', function (done) {

        var agent = new Agent();

        agent.unit({
            path: 'a',
            deps: ['a']
        });

        agent.on('sys:eready', function (err) {
            assert.instanceOf(err, ReferenceError);
            done();
        });

        agent.ready();
    });

    it('Should not share abstract units', function (done) {

        var agent = new Agent();

        agent.unit({
            path: '_x',
            prop: 42
        });

        agent.unit({
            base: '_x',
            path: 'a',
            deps: ['b']
        });

        agent.unit({
            path: 'b'
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.strictEqual(agent.getUnit('a').prop, 42);
            assert.instanceOf(agent.getUnit('b'), Unit);
            assert.isUndefined(agent.getUnit('_x'));
            assert.isUndefined(agent.getUnit('_unit'));

            done();
        });
    });

    it('Should support static members declaration', function (done) {

        var agent = new Agent();

        agent.unit([{
            path: 'b'
        }, {
            st: 42
        }]);

        agent.ready().then(function () {
            assert.strictEqual(agent.getUnit('b').__self.st, 42);

            done();
        });
    });

    it('Should support mixins', function (done) {

        function Mixin () {}

        Mixin.prototype = {
            foo: function () {

                return 42;
            }
        };

        var agent = new Agent();

        agent.unit({
            path: 'test',
            base: ['_unit', Mixin]
        });

        agent.ready().done(function () {
            var unit = agent.getUnit('test');

            assert.instanceOf(unit, Unit);
            assert.isFunction(unit.foo);
            assert.strictEqual(unit.foo(), 42);

            done();
        });
    });
});
