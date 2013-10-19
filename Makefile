#!/usr/bin/make

.DEFAULT_GOAL := all

all:: hooks
all:: lint
all:: cover
all:: readme

cover: modules
	./tools/cover

hooks:
	./tools/init-githooks

lint: modules
	./tools/lint

modules:
	npm install

readme:
	./tools/readme

test: modules
	./tools/test

.PHONY: modules all cover hooks lint test
