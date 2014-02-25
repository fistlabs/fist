'use strict';

exports.deps = ['className', 'error', 'data', 'knot'];

exports.data = function (track, errors, result) {

    track.send(200, {
        result: result,
        errors: errors
    });
};
