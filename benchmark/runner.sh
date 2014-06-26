#!/bin/sh

node $1 &
pid=$!;

echo running $1;

sleep 2;

wrk "http://localhost:1337/index/?foo=bar&baz=zot" -d 10 -c 50 -t 8 | grep "/sec";

kill ${pid};
echo;
