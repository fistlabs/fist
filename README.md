fist [![Build Status](https://travis-ci.org/fistlabs/fist.png?branch=master)](https://travis-ci.org/fistlabs/fist) [![Dependency Status](https://david-dm.org/fistlabs/fist.svg)](https://david-dm.org/fistlabs/fist) [![devDependency Status](https://david-dm.org/fistlabs/fist/dev-status.svg)](https://david-dm.org/fistlabs/fist#info=devDependencies)
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
###```app.ready([force])```
Запускает инициализацию приложения и возвращает ```promise```, статус которого является статусом инициализации приложения.
Если инициализация уже была выполнена то снова она выполнена не будет. Но можно передать параметр ```force```, тогда инициализация будет запущена в принудительном порядке и все узлы и плагины будут проинстанцированы снова. Это действие выполняется автоматически при старте сервера приложения.
###```app.params```
Все параметры приложения, которые были переданы в конструктор
###```app.renderers```
Объект, ключами которого являются имена шаблонов, а значениями - функции, которые вызываются в контексте ```track```. Используется в методе ```track.render``` для шаблонизации данных.

##События
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
###```sys:request```
В приложение поступил запрос
###```sys:match```
Роутер сматчил запрос
###```sys:ematch```
Роутер не нашел подходящего шаблона для запроса
###```sys:response```
Приложение выполнило ответ

#Плагины
Плагином приложения является обычная функция, которая вызывает резолвер по завершении своей работы. Плагины могут использоваться для конфигурирования и расширения возможностей приложения.
Когда запускается сервер, сначала выполняются плагины, и когда они все отработают приложение начинает отвечать на запросы. Пока приложение инициализируется, запросы откладываются на обработку после инициализации. Если хотя бы один плагин был разрешен с ошибкой, то приложение проинициализируется, но начнет отвечать  ```500 Internal Server Error```.
Для того чтобы отклонить выполнение плагина нужно передать любой аргумент в резолвер.
```js
app.plug(function (done) {
    doSomethingAsync(function (err) {
        if ( err ) {
            done(err);
        } else {
            done();
        }
    });
});
```
Если есть возможность устранить проблему, то по факту ее устранения можно перезапустить приложение вызвав ```app.ready(true)```
#Узлы
Узлом приложения является инкапсулированая логическая часть приложения, динамичность поведения которой зависит от контекста вызова и параметров запроса. Узлы декларируются методом ```app.unit```. Необходимо обязательно указать ```path``` узла и имплементировать метод ```data```. Узел может зависеть от результатов других узлов, тогда нужно указать массив ```deps``` с идентификаторами узлов.

```js
app.unit({
    path: 'fortyTwo',
    deps: ['someUnit'],
    data: function () {
        
        return 42;
    }
});
```
Объект передаваемый в метод ```app.unit``` является расширением прототипа узла. По умолчанию каждый узел наследует от ```fist/unit/Unit```, но можно наследовать от любого узла. Для этого необходимо указать ```String base```, что является именем узла, от которого нужно унаследовать. В приложении могут быть абстрактные узлы, декларация которых не требуется, но от которых нужно унаследовать. Такие абстрактные узлы должны наследовать от ```fist/unit/Unit``` с помощью [```inherit```](//github.com/dfilatov/inherit). Получившийся в результате наследования конструктор должен указываться в ```base```.
```js
var Model = require('./lib/Model');

app.unit({
    base: Model,
    path: 'users',
    data: function (track, ctx) {
        return getUsers(this.__base(track, ctx));
    }
});

```
###```unit.addDeps(deps)```
Добавляет зависимости в узел.
```js
app.unit({
    base: 'users',
    path: 'extendedUsers',
    __constructor: function (params) {
        this.__base(params);
        this.addDeps('userExtensions');
    },
    data: function (track, ctx) {
        return doSomethingWithUsers(this.__base(track, ctx));
    }
});
```

###```unit.params```
Параметры узла. Все узлы инстанцируются со всеми параметрами приложения.
```js
var config = {a: 42};
var app = new Framework(config);
app.unit({
    path: 'test',
    __constructor: function (params) {
        assert.deepEqual(params, config);
    }
})
```
#Track
Этот объект является контекстом запроса. В нем содержатся средства для чтения из ```request``` и для записи в ```response```.
###```track.arg(name[, only])```
Возвращает параметр запроса. Если передать только ```name```, то будет возвращено значение из ```pathname``` или из ```query``` если в ```pathname``` он не будет найден. Параметр ```only``` означает что значения из query не интересуют, и нужно искать параметр только в ```pathname```.
```js
app.route('/(<pageName>/)', {name: 'anyPage', unit: 'universalController'});
//  ***
//  GET /index/
track.arg('pageName') // -> index
//  GET /?pageName=foo
track.arg('pageName') // -> foo
track.arg('pageName', true) // -> undefined
```
###```track.header(name[, value])```
Устанавливает заголовок в ```response``` или читает его из ```request```
```js
//  Поставить шапку в ответ
track.header('Content-Type', 'text/html');

track.header('Cookie') // -> name=value
```
###```track.cookie(name[, value[, opts]])```
Читает куку из ```request``` или ставит ее в ```response```
```js
track.cookie('name') // -> value

//  Выставить куку
track.cookie('name', 'value', {
    path: '/'
})
```
###```track.send([status[, body]])```
Выполняет ответ приложения
```js
track.send(200, ':)');
```
###```track.body()```
Скачивает тело запроса и парсит его, возвращает ```promise```
```js
track.body().then(function (body) {

    //  в поле body.type содержится тип тела multipart/json/urlencoded/raw
    //  в поле body.input содержится само тело, во всех случаях кроме raw это ключ-значение,
    //  если тело - raw, то это будет Buffer
    //  Если тело - multipart, то можно обнаружит специальное поле files
});
```
###```track.redirect([status, ]url)```
Создает перенаправление на клиенте
```js
track.redirect(301, 'http://www.yandex.ru');
```
###```track.buidlPath(routeName[, opts])```
Создает ```url``` из шаблона запроса
```js
app.route('/(<pageName>/)', {name: 'anyPage', unit: 'universalController'});
//  ***
track.buildPath('anyPage', {pageName: 'test', x: 42}); // -> /test/?x=42
```

###```track.url```
Объект распаршенного ```url``` запроса
###```track.match```
Объект параметров запроса, сматчившихся на шаблон ```url```-а
###```track.route```
Имя маршрута, на который сматчился запрос
###```track.render([code, ]name[, arg...])```
Выполняет ответ приложения, предварительно отшаблонизировав даннеы по одному из заданныз шаблонов

#Контекст
Второй аргумент, который передается в метод узла ```data``` - ```ctx```. Этот объект в первую очередь содержит в себе результаты выполнения зависимостей узла в объектах ```ctx.res``` и ```ctx.ers```. Так как имена узлов, содержашие точки интерпретируются особым образом, для удобства доступа ко вложенным свойствам этих объектов есть методы ```getRes(path)``` и ```getErr(path)```, которые возвращают значения из соответствующих объектов по переданному пути.

#Роутер
Роутер является неотъемлемой частью фреймворка. Синтаксис шаблонов роутера можно найти [тут](//github.com/golyshevd/finger)
