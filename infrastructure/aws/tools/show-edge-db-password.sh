
# This (temporary) tool can be used for outputting the current EdgeDb passwords from AWS

SECRET=$(aws secretsmanager list-secrets --filter "Key=name,Values=EdgeDb" --query "SecretList[0].ARN" --output text)
PW=$(aws secretsmanager get-secret-value --secret-id $SECRET --query "SecretString" --output text)

echo $PW
