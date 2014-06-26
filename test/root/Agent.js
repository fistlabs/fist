'use strict';

var Agent = require('../../Agent');
var EventEmitter = require('events').EventEmitter;
var Unit = require('../../unit/_unit');
var _ = require('lodash-node');

module.exports = {
    Agent: [
        function (test) {

            var agent = new Agent();

            test.ok(agent instanceof EventEmitter);
            test.ok(_.isObject(agent.units));
            test.done();
        }
    ],
    'Agent.prototype.ready': [
        function (test) {

            var agent = new Agent({x: 42});

            agent.unit({
                path: 'a'
            });

            agent.unit({
                path: 'b'
            });

            agent.ready().then(function () {
                test.ok(agent.getUnit('a') instanceof Unit);
                test.ok(agent.getUnit('b') instanceof Unit);
                test.ok(_.isUndefined(agent.getUnit('c')));
                test.done();
            });
        },
        function (test) {

            var agent = new Agent({x: 42});

            agent.unit({
                path: 'a',
                base: 'b'
            });

            agent.unit({
                path: 'b'
            });

            agent.ready().then(function () {
                test.ok(agent.getUnit('a') instanceof Unit);
                test.ok(agent.getUnit('b') instanceof Unit);
                test.ok(agent.getUnit('a') instanceof agent.units.b[0]);
                test.done();
            });
        },
        function (test) {

            var agent = new Agent({x: 42});

            agent.unit({
                path: 'a',
                base: 'b'
            });

            agent.ready().fail(function (err) {
                test.ok(err instanceof ReferenceError);
                test.done();
            });
        },
        function (test) {

            var agent = new Agent({x: 42});

            agent.unit({
                path: 'a',
                deps: ['b']
            });

            agent.unit({
                path: 'b'
            });

            agent.ready().then(function () {
                test.ok(agent.getUnit('a') instanceof Unit);
                test.ok(agent.getUnit('b') instanceof Unit);
                test.done();
            });
        },
        function (test) {

            var agent = new Agent({x: 42});

            agent.unit({
                path: 'a',
                deps: ['b']
            });

            agent.ready().then(function () {
                test.ok(agent.getUnit('a') instanceof Unit);
                test.done();
            });
        },
        function (test) {

            var agent = new Agent({x: 42});

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
                test.ok(err instanceof ReferenceError);
                test.done();
            });
        },
        function (test) {

            var agent = new Agent({x: 42});
            var promise = agent.ready();

            test.strictEqual(promise, agent.ready());
            test.notStrictEqual(promise, agent.ready(true));

            test.done();
        },
        function (test) {

            var agent = new Agent();

            agent.unit({
                path: 'a',
                deps: ['a']
            });

            agent.on('sys:eready', function (err) {
                test.ok(err instanceof ReferenceError);
                test.done();
            });

            agent.ready();
        },
        function (test) {

            var agent = new Agent();

            agent.unit({
                path: 'a'
            });

            agent.on('sys:ready', function () {
                test.ok(this.getUnit('a') instanceof Unit);
                test.done();
            });

            agent.ready();
        },
        function (test) {

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
                test.ok(agent.getUnit('a') instanceof Unit);
                test.strictEqual(agent.getUnit('a').prop, 42);
                test.ok(agent.getUnit('b') instanceof Unit);
                test.strictEqual(agent.getUnit('_x'), void 0);
                test.strictEqual(agent.getUnit('_unit'), void 0);
                test.done();
            });
        },
        function (test) {

            var agent = new Agent();

            agent.unit([{
                path: 'b'
            }, {
                st: 42
            }]);

            agent.ready().then(function () {
                test.strictEqual(agent.getUnit('b').__self.st, 42);
                test.done();
            });
        }
    ]
};
