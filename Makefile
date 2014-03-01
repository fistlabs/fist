#!/usr/bin/make

.DEFAULT_GOAL := all
NODE_MODULES := ./node_modules/

all:: cover

$(NODE_MODULES):
	npm install

cover: modules
	tools/cover

modules: $(NODE_MODULES)

.PHONY: all cover modules
