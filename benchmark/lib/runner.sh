#!/bin/sh

for benchmark in $*; do

    node ${benchmark} &
    pid=$!;

    echo ${pid} ${benchmark};

    sleep 2;

    wrk -c 50 -d 20 -t 8 "http://127.0.0.1:1337/index/?foo=bar&baz=zot" | grep "/sec";

    kill ${pid};

    echo;

    sleep 3;

done;
