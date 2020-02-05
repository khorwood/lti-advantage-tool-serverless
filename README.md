# lti-advantage-tool

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

## To run on local

1. Download the ngrok on https://dashboard.ngrok.com/get-started and connect to your account.
2. Run ngrok.exe, start ngrok using command `ngrok http https://localhost:3000`. You will get a ngrok https Url like this `https://1d469e88.ngrok.io`.
3. Create the [TLS Keys](#create-tls-keys) and install the [serverless](#install-serverless-for-development) follow the above description.
4. Start the Dynamo using the command  `BASE_URI={https URL from ngrok} sls dynamodb start`. ex: `BASE_URI=https://1d469e88.ngrok.io sls dynamodb start`.
5. Start API Gateway using the command `BASE_URI={https URL from ngrok} sls offline`. ex: `BASE_URI=https://1d469e88.ngrok.io sls offline`.
6. Register and deploy the tool using ngrok https URL and the [endpoints](#Endpoints) above.
7. Create a client configuration by posting to `{https URL from ngrok}/configure`.