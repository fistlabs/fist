#!/bin/sh

for benchmark in $*; do

    node ${benchmark} &
    pid=$!;

    echo running ${benchmark};

    sleep 2;

    wrk "http://localhost:1337/index/?foo=bar&baz=zot" -d 10 -c 50 -t 8 | grep "/sec";

    kill ${pid};
    echo;

done;
