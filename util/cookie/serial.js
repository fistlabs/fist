'use strict';

function buildGMTTime (expires) {

    //  max-age
    if ( 'number' === typeof expires ) {
        expires = new Date(Date.now() + expires);
    }

    //  expires as {Date}
    if ( expires instanceof Date ) {

        return expires.toUTCString();
    }

    //  guess any supported date format
    expires = new Date(expires).toUTCString();

    //  fail
    if ( 'Invalid Date' === expires ) {

        return null;
    }

    return expires;
}

module.exports = function serial (name, value, opts) {

    var expires;

    value = [name + '=' + value];

    if ( Object(opts) !== opts ) {

        return value[0];
    }

    if ( opts.domain ) {
        value[value.length] = 'domain=' + opts.domain;
    }

    if ( opts.path ) {
        value[value.length] = 'path=' + opts.path;
    }

    if ( opts.expires || 0 === opts.expires ) {
        expires = buildGMTTime(opts.expires);

        if ( 'string' === typeof expires ) {
            value[value.length] = 'expires=' + expires;
        }
    }

    if ( opts.secure ) {
        value[value.length] = 'secure';
    }

    return value.join('; ');
};
