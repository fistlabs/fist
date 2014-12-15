#!/bin/sh

sourceDir=$( dirname ${BASH_SOURCE[0]}; );

${sourceDir}/lib/runner.sh $( ls ${sourceDir}/lib/*.js )
