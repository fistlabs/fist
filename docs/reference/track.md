#Track

Track is an abstraction on [```IncomingMessage```](http://nodejs.org/api/http.html#http_http_incomingmessage) and [```ServerResponse```](http://nodejs.org/api/http.html#http_class_http_serverresponse).

Track instance is available in any unit.

##```Object track.params```
Route parameters.

##```Logger track.logger```
Request context logger

##```IncomingMessage track.req```
Original request object

##```ServerResponse track.res```
Original response object

##```Object track.url```
Parsed request url

##```Track track.status(Number statusCode)```
Set status code to response

##```Number track.status()```
Get current status code

##```Object track.header()```
Get all request headers as object

##```* track.header(String name)```
Get request header value by name

##```Track track.header(String name, String value)```
Set header to response

##```Track track.header(Object headers)```
Set multiple headers to response

##```Object track.cookie()```
Get all request cookies

##```* track.cookie(String name)```
Get request cookie by name

##```Track track.cookie(String name, String value[, Object options])```
Set cookie to response

##```void track.send(void|String|Buffer|Readable|Error|Object)```
Write data to response

##```Promise track.invoke(String unitName[, Object args])```
Calls the unit by name and returns promise.

