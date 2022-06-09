#!/bin/zsh

edgedb instance destroy elsadata --force
rm dbschema/migrations/0000*
edgedb instance create elsadata
edgedb project init --non-interactive --link --server-instance elsadata
edgedb migration create --non-interactive
edgedb migration apply
