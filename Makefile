#!/usr/bin/make

.DEFAULT_GOAL := all
NODE_MODULES := ./node_modules/

all:: hooks
all:: check
all:: cover
all:: readme

$(NODE_MODULES):
	npm install

check: modules
	tools/check

cover: modules
	tools/cover

hooks:
	tools/init-githooks

lint: modules
	tools/lint

style: modules
	tools/style

modules: $(NODE_MODULES)

readme:
	tools/readme

test: modules
	tools/test

test-harmony: modules
	tools/test-harmony

.PHONY: all cover hooks lint modules test
