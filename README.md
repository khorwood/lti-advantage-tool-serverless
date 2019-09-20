# lti-advantage-tool

[![CircleCI](https://circleci.com/gh/khorwood/lti-advantage-tool-serverless.svg?style=svg)](https://circleci.com/gh/khorwood/lti-advantage-tool-serverless)

A test harness which implements an IMS LTI Advantage tool in AWS

## Initial setup

```sh
mkdir dev-certs
openssl req -nodes -days 365 -new -x509 -keyout dev-certs/key.pem -out dev-certs/cert.pem

npm install serverless -g
npm ci
sls dynamodb install
```

Add the public key to your OS trusted key store

To start DynamoDB local:

`sls dynamodb start`

To start API gateway:

`sls offline`

### Configuration API

Create a client configuration by posting to `/configure`

```json
{
    "client_id": "<auth service issued client id>",
    "deployment_id": "<platform issued deployment id>",
    "audience": "<auth service required audience>",
    "issuer": "<platform issuer>",
    "authenticate_uri": "<platform authenticate uri>",
    "public_key_uri": "<platform public key uri>",
    "token_uri": "<auth service token uri>"
}
```

## Links

| Link | Description |
| -- | -- |
| `/links/simple` | A link to test launches |
| `/links/ags` | A link to the AGS line items for the launched context |
| `/links/nrps` | A link to the NRPS data for the launched context |
