'use strict';

function isCap (s) {

    return s.toUpperCase() === s;
}

module.exports = function (s) {

    var buf;
    var i;
    var l;

    //  data - > data
    if ( !isCap(s.charAt(0)) ) {

        return s;
    }

    //  DATA - > data
    if ( isCap(s) ) {

        return s.toLowerCase();
    }

    //  Data - > data
    if ( !isCap(s.charAt(1)) ) {

        return s.charAt(0).toLowerCase() + s.slice(1);
    }

    //  HTTPData - > httpData

    buf = '';

    for ( i = 0, l = s.length; i < l; i += 1 ) {

        if ( isCap(s.charAt(i + 1)) ) {

            continue;
        }

        buf = s.slice(0, i).toLowerCase() + s.slice(i);

        break;
    }

    return buf;
};
