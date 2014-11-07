/*global describe, it*/
'use strict';

var _ = require('lodash-node');
var assert = require('chai').assert;

describe('core/agent', function () {
    /*eslint max-nested-callbacks: [2, 4]*/
    var Agent = require('../core/agent');
    var Unit = require('../core/unit');

    it('Should be an instance of core/agent', function () {
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

    describe('.getUnit', function () {
        it('Should return unit', function () {
            var agent = new Agent();

            agent.unit({
                name: 'foo'
            });

            agent.ready().done(function () {
                assert.instanceOf(agent.getUnit('foo'), Unit);
            });
        });
    });

    describe('.alias', function () {
        it('Should create alias', function (done) {
            var agent = new Agent();

            agent.unit({
                name: 'foo'
            });

            agent.alias('foo', 'bar');

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo'));
                assert.ok(agent.getUnit('bar'));
                done();
            });
        });

        it('Should create aliases by map', function (done) {
            var agent = new Agent();

            agent.unit({
                name: 'foo'
            });

            agent.alias({
                foo: 'bar'
            });

            agent.ready().done(function () {
                assert.ok(agent.getUnit('foo'));
                assert.ok(agent.getUnit('bar'));
                done();
            });
        });
    });

    it('Should initialize units before ready', function (done) {
        var agent = new Agent();

        agent.unit({
            name: 'a'
        });

        agent.unit({
            name: 'b'
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.instanceOf(agent.getUnit('b'), Unit);
            assert.isUndefined(agent.getUnit('c'));
            done();
        }).done();
    });

    it('Should inherit units from units', function (done) {
        var agent = new Agent();

        agent.unit({
            name: 'a',
            base: 'b'
        });

        agent.unit({
            name: 'b',
            x: 42
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.instanceOf(agent.getUnit('b'), Unit);
            assert.strictEqual(agent.getUnit('b').x, 42);
            assert.strictEqual(agent.getUnit('a').x, 42);
            done();
        }).done();
    });

    it('Should failed while init coz base not found', function (done) {
        var agent = new Agent();

        agent.unit({
            name: 'a',
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
            name: 'a',
            deps: ['b']
        });

        agent.unit({
            name: 'b'
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
            name: 'a',
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
            name: 'a',
            deps: ['b', 'd']
        });

        agent.unit({
            name: 'b',
            deps: 'c'
        });

        agent.unit({
            name: 'c',
            deps: ['a']
        });

        agent.unit({
            name: 'd',
            deps: ['b']
        });

        agent.unit({
            name: 'z',
            deps: ['x']
        });

        agent.unit({
            name: 'x',
            deps: ['z']
        });

        agent.ready().fail(function (err) {
            assert.instanceOf(err, ReferenceError);
            done();
        }).done();
    });

    it('Should not require members.name specified', function (done) {
        var agent = new Agent();

        agent.unit({
            sign: 42
        });

        agent.ready().done(function () {
            assert.ok(!_.isEmpty(agent.units));
            done();
        });
    });

    it('Should emit sys@ready on init', function (done) {
        var agent = new Agent();

        agent.unit({
            name: 'a'
        });

        agent.channel('sys').on('ready', function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            done();
        });

        agent.ready();
    });

    it('Should emit sys@eready on init error', function (done) {
        var agent = new Agent();

        agent.unit({
            name: 'a',
            deps: ['a']
        });

        agent.channel('sys').on('eready', function (err) {
            assert.instanceOf(err, ReferenceError);
            done();
        });

        agent.ready();
    });

    it('Should not share abstract units', function (done) {
        var agent = new Agent();

        agent.unit({
            name: '_x',
            prop: 42
        });

        agent.unit({
            base: '_x',
            name: 'a',
            deps: ['b']
        });

        agent.unit({
            name: 'b'
        });

        agent.ready().then(function () {
            assert.instanceOf(agent.getUnit('a'), Unit);
            assert.strictEqual(agent.getUnit('a').prop, 42);
            assert.instanceOf(agent.getUnit('b'), Unit);
            assert.isUndefined(agent.getUnit('_x'));

            done();
        });
    });

    it('Should support static members declaration', function (done) {
        var agent = new Agent();

        agent.unit({
            name: 'b'
        }, {
            st: 42
        });

        agent.ready().then(function () {
            assert.strictEqual(agent.getUnit('b').__self.st, 42);

            done();
        });
    });

    it('Should support mixins (0)', function (done) {

        function Mixin() {}

        Mixin.prototype = {
            foo: function () {

                return 42;
            }
        };

        var agent = new Agent();

        agent.unit({
            name: 'test',
            mix: [Mixin]
        });

        agent.ready().done(function () {
            var unit = agent.getUnit('test');

            assert.instanceOf(unit, Unit);
            assert.isFunction(unit.foo);
            assert.strictEqual(unit.foo(), 42);

            done();
        });
    });

    it('Should support mixins (0)', function (done) {
        var agent = new Agent();

        function Mixin() {}

        Mixin.prototype = {
            foo: function () {

                return 42;
            }
        };

        agent.unit({
            name: 'test',
            mix: Mixin
        });

        agent.ready().done(function () {
            var unit = agent.getUnit('test');

            assert.instanceOf(unit, Unit);
            assert.isFunction(unit.foo);
            assert.strictEqual(unit.foo(), 42);

            done();
        });
    });

    it('Should not instantiate abstract units', function (done) {
        var agent = new Agent();
        var spy = [];

        agent.unit({
            name: '_test',
            __constructor: function (params) {
                this.__base(params);
                spy.push(1);
            }
        });

        agent.unit({
            base: '_test',
            name: 'x'
        });

        agent.ready().done(function () {
            assert.deepEqual(spy, [1]);
            done();
        });
    });
});
