#!/bin/zsh

gel instance destroy -I elsadata --force
gel instance create --version 6 elsadata
gel project init --non-interactive --link --server-instance elsadata
gel migration create --non-interactive
gel migration apply
