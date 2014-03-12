'use strict';

var Classic = /** @type Classic */ require('./Classic');

/**
 * @class Switcher
 * @extends Classic
 * */
var Switcher = Classic.extend(/** @lends Switcher.prototype */ {

    /**
     * @public
     * @memberOf {Switcher}
     * @method
     *
     * @param {Connect} track
     * @returns {*}
     * */
    find: function (track) {
        //  Таким образом можно например тут проверить
        //  поддерживается ли приложением host с которым пришел клиент
        //  и если нет, то отправить ошибку 404 скажем.
        //  Можно матчиться абсолютно на любые данные
        //  запроса которые можно добыть синхронно
        return Switcher.parent.find.call(this,
            track.method, track);
    },

    /**
     * @protected
     * @memberOf {Switcher}
     * @method
     *
     * @param {Pathr} route
     * @param {Connect} track
     *
     * @returns {Object}
     * */
    _match: function (route, track) {

        //  Если уж мы заговорили о host, то тут можно проверить
        // принадлежит ли данный route определенному хосту
        return route.match(track.url.pathname);
    }

});

module.exports = Switcher;
