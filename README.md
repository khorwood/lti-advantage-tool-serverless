# lti-advantage-tool

THIS PROJECT HAS BEEN ABANDONED DUE TO LACK OF TIME

[![CircleCI](https://circleci.com/gh/khorwood/lti-advantage-tool-serverless.svg?style=svg)](https://circleci.com/gh/khorwood/lti-advantage-tool-serverless)

A test harness which implements an IMS LTI Advantage tool in AWS

## Initial setup

### Create TLS Keys

```sh
mkdir dev-certs
openssl req -nodes -days 365 -new -x509 -keyout dev-certs/key.pem -out dev-certs/cert.pem
```

Add the public key (`cert.pem`) to your OS trusted key store

### Install Serverless for development

```sh
npm install serverless -g
npm ci
sls dynamodb install
```

To start DynamoDB local:

`sls dynamodb start`

To start API gateway:

`sls offline`

## Endpoints

| Endpoint | Description |
| -- | -- |
| `/.well-known/jwks.json` | The JSON Web Key Set endpoint |
| `/authenticate` | The authentication endpoint for return from platform |
| `/configure` | A REST endpoint for configuring clients (platforms) |
| `/connect` | The launch initiation endpoint |

### Configuration API

Create a client (platform) configuration by posting to `/configure`

```json
{
    "client_id": "<OAuth2 client_id>",
    "deployment_id": "<platform issued deployment id>",
    "audience": "<OAuth2 audience>",
    "issuer": "<platform issuer>",
    "authenticate_uri": "<platform authenticate uri>",
    "public_key_uri": "<platform public key uri>",
    "token_uri": "<OAuth2 token uri>"
}
```

## Links

| Link | Description |
| -- | -- |
| `/links/simple` | A link to test basic launches |
| `/links/ags` | A link to test the AGS line items for the launched context |
| `/links/nrps` | A link to test the NRPS data for the launched context |

## Tables

| Table | Description |
| -- | -- |
| `LtiClients` | Contains client (platform) registration data |
| `LtiSessions` | Contains user launch session data |
| `LtiKeys` | Contains the private keys used by the tool |
