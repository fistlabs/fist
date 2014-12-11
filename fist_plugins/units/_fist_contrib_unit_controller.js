'use strict';

var FistError = require('../../core/fist-error');

var _ = require('lodash-node');
var f = require('util').format;
var hasProperty = Object.prototype.hasOwnProperty;
var vow = require('vow');
var path = require('path');

/**
 * @class Renderer
 * @param {Array<String>} roots
 * */
function Renderer(roots) {

    /**
     * @public
     * @memberOf {Renderer}
     * @property
     * @type {String}
     * */
    this.roots = roots;

    /**
     * @public
     * @memberOf {Renderer}
     * @property
     * @type {Array}
     * */
    this.engines = [];

    /**
     * @public
     * @memberOf {Renderer}
     * @property
     * @type {Array}
     * */
    this.checked = {};
}

function lookupRenderFunction(self, ending) {
    var engines;
    var engine;
    var filename;
    var i;
    var j;
    var k;
    var l;
    var root;
    var roots;

    if (hasProperty.call(self.checked, ending)) {
        return self.checked[ending];
    }

    engines = self.engines;
    roots = self.roots;

    for (i = 0, l = roots.length; i < l; i += 1) {
        root = roots[i];
        filename = path.resolve(root, ending);

        for (j = 0, k = engines.length; j < k; j += 1) {
            engine = engines[j];

            if (isSuitable(filename, engine.ending)) {
                self.checked[ending] = engine.render;
                return engine.render;
            }
        }
    }

    return defaultRender;
}

function isSuitable(filename, ending) {
    //  do not use path.extname coz are files like that: "foo.bemhtml.js"
    //  extname will return ".js" but we want ".bemhtml.js"
    var i = filename.indexOf(ending);

    if (i === -1) {
        return false;
    }

    return i + ending.length === filename.length;
}

function defaultRender(filename, callback) {
    callback(new FistError('NO_ENGINE_FOUND',
        f('There is no engine found for file "%s"', filename)));
}

/**
 * @public
 * @memberOf {Renderer}
 * @method
 *
 * @param {String} ending
 * @param {Function} render
 *
 * @returns {Renderer}
 * */
Renderer.prototype.engine = function (ending, render) {
    this.engines.push({
        ending: ending,
        render: render
    });

    return this;
};

/**
 * @public
 * @memberOf {Renderer}
 * @method
 *
 * @param {String} ending
 * @param {*} options
 * */
Renderer.prototype.render = function (ending, options) {
    var defer = vow.defer();
    var render = lookupRenderFunction(this, ending);

    render(ending, options, function (err, res) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(res);
        }
    });

    return defer.promise();
};

module.exports = function (agent) {

    /**
     * @public
     * @memberOf agent
     * @property
     * @type {Renderer}
     * */
    var views = agent.views = new Renderer([]);

    /**
     * @class _fist_contrib_unit_controller
     * @extends _fist_contrib_unit
     * */
    agent.unit({

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {String}
         * */
        base: '_fist_contrib_unit',

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {String}
         * */
        name: '_fist_contrib_unit_controller',

        /**
         * @private
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         * @constructs
         * */
        __constructor: function () {
            this.__base();

            if (this.rule) {
                agent.route(this.rule, {
                    name: this.name,
                    unit: this.name
                });
            }
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {Number}
         * */
        maxAge: 0,

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {String}
         * */
        lookupTemplateNameEnd: function (track, context) {
            /*eslint no-unused-vars: 0*/
            throw new FistError('NOT_IMPLEMENTED', 'You need to implement template lookup function');
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {Number}
         * */
        lookupResponseStatus: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return track.status();
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {Object}
         * */
        lookupResponseHeader: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return {
                'Content-Type': 'text/html; charset="UTF-8"'
            };
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {Object}
         * */
        createTemplateOptions: function (track, context) {
            return context;
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Model} context
         *
         * @returns {vow.Promise}
         * */
        main: function (track, context) {
            var fileEnd = this.lookupTemplateNameEnd(track, context);
            var options = this.createTemplateOptions(track, context);

            return views.render(fileEnd, options).then(function (result) {
                track.
                    status(this.lookupResponseStatus(track, context)).
                    header(this.lookupResponseHeader(track, context)).
                    send(result);
            }, this);
        }
    });

};
