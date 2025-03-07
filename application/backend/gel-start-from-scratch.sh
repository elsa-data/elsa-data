#!/bin/zsh

gel instance destroy -I elsadata --force
rm dbschema/migrations/000*
gel instance create elsadata
gel project init --non-interactive --link --server-instance elsadata
gel migration create --non-interactive
gel migration apply
