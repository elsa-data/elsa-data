
# note: NOT setup for general use.. depends on a directory structure outside the project
# todo: fix

npx pbjs --es6 -p ../../../../GA4GH/phenopacket-schema/src/main/proto phenopackets/schema/v2/phenopackets.proto -t static -o src/generated/phenopackets.js
npx pbts src/generated/phenopackets.js > src/generated/phenopackets.d.ts

