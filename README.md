fist [![Build Status](https://travis-ci.org/fistlabs/fist.png?branch=master)](https://travis-ci.org/fistlabs/fist)
=========
```Fist``` - это nodejs-фреймворк для написания серверных приложений. ```Fist``` предлагает архитектуру, поддержка которой одинаково проста как для простых так и для сложных web-серверов.
```js
var Framework = require('fist/Framework');
var app = new Framework();

app.unit({
    path: 'time.appstart', 
    data: new Date()
});

app.unit({
    path: 'time.uptime',
    deps: ['time.appstart'],
    data: function (track, ctx) {
        return new Date() - ctx.getRes('time.appstart')
    }
});

app.unit({
    path: 'uptimeController', 
    deps: ['time.uptime'], 
    data: function (track, ctx) {
        return track.send(ctx.getRes('time.uptime'));
    }
});

app.route('/uptime/', 'uptimeController');

app.listen(1337);
```

Приложение фреймворка представляет собой плагинизируемый веб-сервер, состоящий из множества взаимосвязанных, зависящих друг от друга узлов, один из которых может обработать поступивший запрос, принятый роутером.

Приходящий в сервер запрос матчится первый подходящий локейшен, описанный в роутере. Каждый локейшн должен быть ассоциирован с узлом, операция разрешения которого запускается при успешном матчинге. Как правило, узел, ассоциированный с локейшеном является контролером и может выполнить ответ приложения. Но если он этого не сделает, то матчинг продолжится и операция повторится уже на другом узле, до тех пор пока один из них не выполнит ответ.

```js
//  при любом запросе проверять права на просмотр страницы
//  может отправить например 403 если прав нет
app.route('/ e', {
    // название роута
    name: 'checkRights',
    //  название узла с которым роут ассоциирован
    unit: 'rightChecker'
});

//  отображает главную страницу если есть права
app.route('/', {
    name: 'indexPage',
    unit: 'indexPageController'
});

//  настройки сайта
app.route('/settings/', {
    name: 'settingsPage',
    unit: 'settingsPageController'
});

//  далее идет декларация узлов
//  ***
```
Узлом приложения является инстанс класса ```fist/unit/Unit```. Каждый узел должен иметь некоторый идентификатор и имплементирать метод ```data```, в который отвечает за разрешение узла. Узлы могут зависеть друг от друга, что должно быть указано в декларации. Это значит что до того как выполнится текущий узел, будут выполнены его зависимости, результаты которых будут доступны в методе ```data```.

```js
app.unit({
    //  идентификатор узла
    path: 'content.news',
    //  тело узла
    data: function () {
        var defer = vow.defer();
        doRequestForNews(function (err, res) {
            if ( err ) {
                defer.reject(err);
            } else {
                defer.resolve(res);
            }
        });
        return defer.promise();
    }
});

app.unit({
    path: 'indexPage',
    //  Зависимости узла
    deps: ['content.news'],
    data: function (track, ctx) {
        return track.send(doTemplate(ctx.getRes('content.news')));
    }
});
```
В каждый узел при его выполнении передается ```track``` и ```ctx```.
Объект ```track``` создается на каждый запрос и аггрегирует возможности ```request``` и ```response```. 
Объект ```ctx``` - это контекст вызова узла, в нем содержатся результаты зависимостей узла.

Результатом разрешения узла является возвращенное из него значение или брошенное исключение. Если преполагается асинхронное выполнение узла, то можно возвратить ```promise```. Узел считается разрешенным когда будет разрешен встроенный в контекст ```promise```, который автоматически резолвится результатом выполнения метода ```data```.


```fist``` работает на nodejs >= 0.10

#Приложение
##API
###```new Framework([params])```
Инстанцирует приложение
```js
var Framework = require('fist/Framework');
var configs = require('./configs');
//  Инстанцирую приложение
var app = new Framework(configs);
```
###```app.listen()```
Запускает сервер приложения
```js
app.listen(1337);
```
###```app.plug(plugin...)```
Добавляет в приложение плагин.
```js
app.plug(function (done) {
    this.myFeature = 42;
    done();
});
```
###```app.route(pattern, data)```
Линкует роут с узлом.
```js
app.route('/', {
    name: 'index',
    unit: 'indexController'
});
```
###```app.unit(decl)```
Добавляет в приложение функциональный узел
```js
app.unit({
    path: 'indexController',
    data: function () {
        doSomething()
    }
});
```
##Событие
Приложение обладает свойствами ```EventEmitter```, поэтому на нем можно слушать некоторые автоматические события.
###```sys:ready```
Приложение готово обрабатывать запросы
###```sys:eready```
Ошибка инициализации приложения
###```ctx:pending```
Начинается разрешение узла
###```ctx:accept```
Узел разрешен без ошибки
###```ctx:reject```
Узeл разрешен с ошибкой
###```ctx:notify```
Узел послал уведомление
