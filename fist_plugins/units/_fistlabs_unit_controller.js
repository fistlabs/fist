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
     * @type {Array<String>}
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

function lookupRenderFunction(self, extname) {
    var engines;
    var engine;
    var filename;
    var i;
    var j;
    var k;
    var l;
    var root;
    var roots;

    if (hasProperty.call(self.checked, extname)) {
        return self.checked[extname];
    }

    engines = self.engines;
    roots = self.roots;

    for (i = 0, l = roots.length; i < l; i += 1) {
        root = roots[i];
        filename = path.resolve(root, extname);

        for (j = 0, k = engines.length; j < k; j += 1) {
            engine = engines[j];

            if (isSuitable(filename, engine.extname)) {
                self.checked[extname] = engine.render;
                return engine.render;
            }
        }
    }

    return defaultRender;
}

function isSuitable(filename, extname) {
    //  do not use path.extname coz for files like that: "foo.bemhtml.js"
    //  extname will return ".js" but we want ".bemhtml.js"
    var i = filename.indexOf(extname);

    if (i === -1) {
        return false;
    }

    return i + extname.length === filename.length;
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
 * @param {String} extname
 * @param {Function} render
 *
 * @returns {Renderer}
 * */
Renderer.prototype.engine = function (extname, render) {
    this.engines.push({
        extname: extname,
        render: render
    });

    return this;
};

/**
 * @public
 * @memberOf {Renderer}
 * @method
 *
 * @param {String} filename
 * @param {*} options
 * */
Renderer.prototype.render = function (filename, options) {
    var defer = vow.defer();
    var render = lookupRenderFunction(this, filename);

    render(filename, options, function (err, res) {
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
     * @extends Unit
     * */
    agent.unit({

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * */
        base: 0,

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @property
         * @type {String}
         * */
        name: '_fistlabs_unit_controller',

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
         * @param {Context} context
         *
         * @returns {String}
         * */
        lookupTemplateFilename: function (track, context) {
            /*eslint no-unused-vars: 0*/
            throw new FistError('NOT_IMPLEMENTED', 'You need to implement template lookup function');
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {Number}
         * */
        createResponseStatus: function (track, context) {
            /*eslint no-unused-vars: 0*/
            return track.status();
        },

        /**
         * @public
         * @memberOf {_fist_contrib_unit_controller}
         * @method
         *
         * @param {Connect} track
         * @param {Context} context
         *
         * @returns {Object}
         * */
        createResponseHeader: function (track, context) {
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
         * @param {Context} context
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
         * @param {Context} context
         *
         * @returns {vow.Promise}
         * */
        main: function (track, context) {
            var filename = this.lookupTemplateFilename(track, context);
            var options = this.createTemplateOptions(track, context);

            return views.render(filename, options).then(function (result) {
                track.
                    status(this.createResponseStatus(track, context)).
                    header(this.createResponseHeader(track, context)).
                    send(result);
            }, this);
        }
    });

};
