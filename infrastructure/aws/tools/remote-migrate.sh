
# This (temporary) tool can be used until we sort out the migration process

# It will look up the db password and execute a migration based on what is currently in the local schema

# I guess there is a danger here if we have more than one EdgeDb secret - we only pick up the first..
# So if you get mysterious "password invalid" then maybe this is the place


SECRET=$(aws secretsmanager list-secrets --filter "Key=name,Values=EdgeDb" --query "SecretList[0].ARN" --output text)
PW=$(aws secretsmanager get-secret-value --secret-id $SECRET --query "SecretString" --output text)

# make a local copy of the cert CA
rootfile=$(mktemp)
aws secretsmanager get-secret-value --secret-id Elsa --query "SecretString" --output text | jq -r '."edgeDb.tlsRootCa"' > "$rootfile"

echo $PW | edgedb --host elsa-edge-db.dev.umccr.org --port 4000 --user elsa_superuser --password-from-stdin --tls-ca-file $rootfile  migration apply --schema-dir=../../../application/backend/dbschema 

