fist [![Build Status](https://travis-ci.org/fistlabs/fist.png?branch=rc-dev)](https://travis-ci.org/fistlabs/fist)
=========

Fist - это nodejs-фреймворк для написания серверных приложений. Fist предлагает архитектуру, поддержка которой одинаково проста как для простых так и для сложных web-серверов.
```js

var Fist = require('fist/Framework');
var fist = new Fist();

fist.decl('startTime', new Date());

fist.decl('index', ['startTime'], function (track, errors, result) {
    var uptime = new Date() - result.startTime;
    track.send(200, '<div>Server uptime: ' + uptime + 'ms</div>');
});

fist.route('GET', '/', 'index');

fist.listen(1337);
```
* [Базовые понятия](#%D0%91%D0%B0%D0%B7%D0%BE%D0%B2%D1%8B%D0%B5-%D0%BF%D0%BE%D0%BD%D1%8F%D1%82%D0%B8%D1%8F)
  * [Приложение](#%D0%9F%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5)
  * [Плагин](#%D0%9F%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD)
  * [Узел](#%D0%A3%D0%B7%D0%B5%D0%BB)
  * [Трэк]()
  * [Роутер](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80)
* [Расширение](#%D0%A0%D0%B0%D1%81%D1%88%D0%B8%D1%80%D0%B5%D0%BD%D0%B8%D0%B5)
  * [Плагинизация]()
  * [Наследование]()
* [Ссылки](#%D0%A1%D1%81%D1%8B%D0%BB%D0%BA%D0%B8)
  * [Плагины]()
  * [Узлы]()

#Базовые понятия
##Приложение
Приложением называется экземпляр класса [Framework](Framework.js).
Класс [Framework](Framework.js) наследует от EventEmitter, таким образом приложение во время своей работы может сообщать среде о каких либо действиях.
###События
####```sys:ready()```
Приложение проинициализировано и готово отвечать на запросы
####```sys:error(*)```
Критическая ошибка инициализации приложения, оно никогда не подожжет событие ```sys:ready```, то есть никогда не начнет отвечать на запросы. В обработчике есть смысл только прологгировать фатальное исключение и завершить процесс с соответствующим кодом выхода
####```sys:request(Track)```
В приложение поступил запрос
####```sys:response(Track)```
Приложение выполнило ответ
####```sys:match(Track)```
[Роутер](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80) нашел подходящий под url маршрут
####```sys:ematch(Track)```
[Роутер](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80) не смог найти подходящего маршрута
####```sys:accept(Object)```
[Узел](#%D0%A3%D0%B7%D0%B5%D0%BB) разрешен без ошибки
####```sys:reject(Object)```
[Узел](#%D0%A3%D0%B7%D0%B5%D0%BB) разрешен с ошибкой
###API
####```new Framework([params])```
Создает экземпляр приложения.
```js
var Framework = require('fist/Framework');
var app = new Framework();
```
В конструктор можно передать объект параметров, который будет склонирован в объект [app.params](#appparams)
####```app.params```
Объект параметров приложения, переданных при инстанцировании. Может использоваться в [плагинах](#%D0%9F%D0%BB%D0%B0%D0%B3%D0%B8%D0%BD) и [узлах](#%D0%A3%D0%B7%D0%B5%D0%BB).
####```app.decl(name[, deps][, body])```
Метод, декларирует [узел](#%D0%A3%D0%B7%D0%B5%D0%BB) и его зависимости.

```name``` - есть уникальное имя декларации, если продекларировать еще один [узел](#%D0%A3%D0%B7%D0%B5%D0%BB) с такми же ```name```, то последняя декларация "затрет" предыдущую. 

```deps``` - завсисимости [узла](#%D0%A3%D0%B7%D0%B5%D0%BB). Это может быть как массив строк, имен [узлов](##%D0%A3%D0%B7%D0%B5%D0%BB), так и просто строка, если у [узла](#%D0%A3%D0%B7%D0%B5%D0%BB) только одна зависимость. Необязательный аргумент.

```body``` - тело [узла](#%D0%A3%D0%B7%D0%B5%D0%BB), может быть любого типа, а поэтому необязательный аргумент. 
```js
app.decl('answer', 42);
```
####```app.route(verb, expr, name[, data[, opts]])```
Декларирует маршрут во встроенном [роутере](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80) приложения, связывая его с [узлом](#%D0%A3%D0%B7%D0%B5%D0%BB).

```verb``` - метод запроса для ```expr```

```expr``` - шаблон урла запроса в терминах [роутера](#%D0%A0%D0%BE%D1%83%D1%82%D0%B5%D1%80)

```name``` - уникальный идентификатор маршрута. Каждый маршрут должен иметь уникальный идентификатор.

```data``` - статические данные, связанные с маршрутом. Имеет смысл с маршрутом связывать имя [узла](#%D0%A3%D0%B7%D0%B5%D0%BB), который будет разрешен при матчинге урла на ```expr```. По-умолчанию ```data``` === ```name```. Если нужно связать с маршрутом [узел](#%D0%A3%D0%B7%D0%B5%D0%BB) имя которого отличное от ```name``` маршрута, то можно указать это в ```data```.
```js
app.route('GET', '/', 'index', 'customUnit');
//  или так
app.route('POST', '/upload/', 'upload', {
    unit: 'myUploader',
    customData: 42
});

```
```opts``` - опции компилирования ```expr``` в регулярное выражение.

```opts.noend``` - не добавлять якорь конца строки

```opts.nostart``` - не добавлять якорь начала строки

```opts.nocase``` - добавить флаг ignoreCase
```js
app.route('GET', '/static/', 'static-files', 'static', {
    noend: true,
    nocase: true
});
```
####```app.plug([plugin[, plugin...]])```
Добавляет в приложение плагин, который будет выполнен при инициализации.
```js
app.plug(function (done) {
    this.myFeature = 42;
    done();
});
```
####```app.ready()```
Запускает инициализацию приложения. Во время инициализации выполняются все плагины и по ее завершении зажигается событие [```sys:ready```](#sysready), если хотя бы один из плагинов разрешился с ошибкой, то sys:ready никогда не будет зажжено, но будет зажжено [```sys:error```](#syserror)
####```app.listen()```
Запускает сервер приложения и автоматом вызывает [app.ready](#appready)
##Плагин
Плагинами для приложения называются задачи, которые следует выполнить до того как приложение начнет отвечать на запросы. Плагин представляет собой функцию, в которую передается резолвер. Плагин должен вызвать резолвер чтобы объявить о завершении своей работы.
```js
//  подключаю плагин для инициализации шаблонов
app.plug(function (done) {
    var self = this;
    Fs.readDir('views', function (list) {
        list.forEach(function (item) {
            this.renderers[item] = require('./views/' + item);
        }, self);
        done(null, null);
    });
});
```
Плагины начинают отрабатывать при инициализации. Чтобы запустить инициализацию, необходимо вызвать [```app.ready()```](#appready)
##Узел
Узлом называется минимальная самостоятельная функциональная часть приложения. Технически это связка имя + зависимости + тело.
Если у приложения потребовали разрешить узел, то сначала разрешаются зависимости узла, а затем сам узел. Узел может быть разрешен как с результатом так и с ошибкой. Узел декларируется методом [```app.decl```](#appdecl)
Тело узла может быть как функционального типа, так и любого другого.
Если узел имеет функциональное тело, то тело должно разрешить узел одним из нескольких способов по завершении работы узла.
Классический способ разрешить тело узла это вызвать функцию-резолвер ```done```
```js
app.decl('awesome', function (track, errors, result, done) {
    asker('http://example.com/asom-api', done);
});
```
Если ```done``` был вызван с двумя аргументами, то второй аргумент будет считаться результатом разрешения узла. Если ```done``` будет вызыван менее чем с двумя аргументами, то первый аргумент будет считаться ошибкой разрешения узла. Но в любом случае узел будет считаться разрешенным.

Функцию ```done``` вызывать не обязательно, вы можете разрешать узел другими способами. Например если вы вернете из узла любое значение, отличное от ```undefined``` до того как вызовете ```done```, то вызов ```done``` ожидаться не будет. ```Fist``` будет разрешать именно возвращенное значение.
```js
app.decl('version', function () {

    return require('./package.json').version;
});
```
В примере выше возвращается примитив, примитив не может разрешить узел с ошибкой, значит узел будет разрешен без ошибки с возвращенным результатом.

Возвращенные значения могут разрешаться по-разному, в зависимости от их типа. Классический пример - ```promise```. Тут все ясно, ```promise``` может перейти или в состояние ```fulfilled``` или в ```rejected```. Так что если вы вернете ```promise```, то тот по факту своего разрешения разрешит и узел в соответствующее состояние.

Узлы поддерживают и другие возвращаемые значения, подразумевающие асинхронное выполнение. Из узла вы можете вернуть ```thunk``` - такой паттерн из FP, функцию которая вызовет резолвер когда закончит свое выполнение.
```js
app.decl('how2live', function () {

    return function (done) {
        setTimeout(function () {
            done(null, 42);
        }, 100);
    };
});
```
Также из узла вы можете вернуть ```ReadableStream```, тогда результатом разрешения узла будет буффер данных, который будет выкачан из потока, или ошибка, которая может произойти во время чтения.
```js
app.decl('package', function () {
    
    return fs.createReadStream('package.json');
});
```
Из узла вы можете вернуть даже генератор/итератор!
```js
app.decl('gen', function () {

    return {
        _done: false,
        _remains: 5,
        next: function () {
            
            if ( this._done ) {
                throw new TypeError();
            }
        
            if ( 0 === this._remains ) {
                throw new TypeError();
            }
            
            this._remains -= 1;
            
            if ( 0 === this._remains ) {
                this._done = true;
            }
            
            return {
                done: this._done,
                value: Math.random()
            };
        },
        
        throw: function (err) {
            this._done = true;
            throw err;
        }
        
    };
});
```
Такой узел будет разрешен когда генератор закончит генерацию. Будьте бдительны если захотите возвратить бесконечный генератор.

Но и это еще не все! Из узла можно вернуть ```GeneratorFuntion```! ```GeneratorFuncion``` вызовется с аргументом, функцией резолвером, и узел будет разрешен тогда, когда получившийся генератор вызовет ```done``` или завершит генерацию. Если генератор вызовет ```done```, то узел будет разрешен, но генератор все равно будет продолжать работу до конца.
```js
app.decl(function () {
    
    return function * (done) {
    
        var i = 0;
    
        while (i < 5) {
            yield i += 1;
        }
        
        done(null, 42);
        
        yield 100500;
        
        console.log('yeahh!');
        
        return 9000;
    };
});
```
Пример выглядит странным, и это так, зачем писать такой код? Это потому что вы не знаете какие значения можете генерировать и как ```fist``` управляет генератором. Но об этом чуть ниже.

Само тело узла может быть всех типов которые были перечислены выше как возвращаемые значения. Единственное отличие в том что не-функциональные тела узлов будут разрешены единожды и сразу и узел будет разрешен статически, результат будет всегда один и тот же.

```js
app.decl('remoteConfig', vowAsker('http://example.com/config'));
```
Функциональное же тело будет вызваться при каждой операции разрешения узла.

Думаю, самое интересное - это когда телом узла является ```GeneratorFunction```.
```js
app.decl('generate', function * (track, errors, result, done) {
    
    var user = yield getUser(track.cookie('sessid'));
    
    return yield {
        status: getStatus(user.id),
        deals: getUserDeals(user.id)
    };
});
```
Что тут происходит? В узле ```generate``` мы сначала получаем асинхронно статус пользователя. Генерируемые значения могут быть всех типов что и возвращаемые, но плюс два бонуса. Можно сгенерировать массив или объект ключ->значение. Каждое значение в массиве или объекте будет разрешено и результирующий объект будет содержать уже разрешенные значения.

##Трэк
##Роутер
#Расширение
#Ссылки
