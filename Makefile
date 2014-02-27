#!/usr/bin/make

.DEFAULT_GOAL := all
NODE_MODULES := ./node_modules/

all:: hooks
all:: cover
all:: readme

$(NODE_MODULES):
	npm install

cover: modules
	tools/cover

modules: $(NODE_MODULES)

readme:
	tools/readme

test-harmony: modules
	tools/test-harmony

.PHONY: all cover hooks modules test
