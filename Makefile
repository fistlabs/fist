#!/usr/bin/make

.DEFAULT_GOAL := all
NODE_MODULES := ./node_modules/

all:: hooks
all:: lint
all:: cover
all:: readme

$(NODE_MODULES):
	npm install

cover: modules
	./tools/cover

hooks:
	./tools/init-githooks

lint: modules
	./tools/lint

modules: $(NODE_MODULES)

readme:
	./tools/readme

test: modules
	./tools/test

.PHONY: all cover hooks lint modules test
