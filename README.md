# AIC IDM Custom Policy Validation

This repository demonstrates a simple pattern for custom IDM validation policies in PingOne Advanced Identity Cloud:

1. Register custom IDM policies in `config/policy`
2. Attach those policies to `managed/alpha_user` properties
3. Reuse the same policy enforcement in an AIC registration journey through `Attribute Collector`
4. Optionally add `uilocale/en` mappings so the hosted page shows friendly validation messages instead of raw policy keys

The demo journey used here is `DemoIDMPoliciesReg` in the `alpha` realm.

## Repository Contents

- [samples/config-policy.json](samples/config-policy.json): sample IDM `config/policy` payload with the deployed Acme custom policies.
- [samples/sample-policy.js](samples/sample-policy.js): readable JavaScript source for the same policy functions before they are flattened into `globals.additionalPolicies`.
- [samples/managed-alpha-user-properties.json](samples/managed-alpha-user-properties.json): sample `alpha_user` property definitions showing the custom policy attachments.
- [samples/test-valid-alpha-user.json](samples/test-valid-alpha-user.json): example valid `alpha_user` payload.
- [samples/test-invalid-alpha-user.json](samples/test-invalid-alpha-user.json): example invalid `alpha_user` payload that triggers every custom policy in the demo.
- [samples/uilocale-en.json](samples/uilocale-en.json): sample `uilocale/en` document that translates the raw Acme policy keys into friendly hosted-page messages.
- [screenshots/](screenshots/): screenshots of the IDM configuration and the journey behavior with and without localized messages.

## Demo Policies

The sample registers these custom policies:

- `acme-email-domain`: email address must end in `@acme.com`
- `acme-min-length`: minimum string length
- `acme-max-length`: maximum string length
- `acme-valid-au-phone`: Australian phone number validation
- `acme-valid-au-state`: Australian state or territory abbreviation validation
- `acme-valid-au-postcode`: Australian postcode validation

## Demo Property Attachments

The demo uses only the custom policies on the shown fields, with the exception of the structural `VALID_TYPE` checks that still come from the schema type:

- `mail` -> `acme-email-domain`
- `givenName` -> `acme-min-length`, `acme-max-length`
- `sn` -> `acme-min-length`, `acme-max-length`
- `telephoneNumber` -> `acme-valid-au-phone`
- `stateProvince` -> `acme-valid-au-state`
- `postalCode` -> `acme-valid-au-postcode`

The sample property file is [managed-alpha-user-properties.json](samples/managed-alpha-user-properties.json).

## API Example

The invalid test payload is [test-invalid-alpha-user.json](samples/test-invalid-alpha-user.json):

```json
{
  "userName": "demopolicy-api-invalid-01",
  "givenName": "A",
  "sn": "B",
  "mail": "user@gmail.com",
  "telephoneNumber": "123",
  "stateProvince": "ZZ",
  "postalCode": "ABC"
}
```

Example IDM create request:

```http
POST /openidm/managed/alpha_user?_action=create
Content-Type: application/json
Authorization: Bearer <access_token>
```

```json
{
  "userName": "demopolicy-api-invalid-01",
  "givenName": "A",
  "sn": "B",
  "mail": "user@gmail.com",
  "telephoneNumber": "123",
  "stateProvince": "ZZ",
  "postalCode": "ABC"
}
```

Example response:

```json
{
  "code": 403,
  "reason": "Forbidden",
  "message": "Policy validation failed",
  "detail": {
    "result": false,
    "failedPolicyRequirements": [
      {
        "policyRequirements": [
          {
            "params": {
              "min": 2
            },
            "policyRequirement": "ACME_MIN_LENGTH"
          }
        ],
        "property": "givenName"
      },
      {
        "policyRequirements": [
          {
            "policyRequirement": "ACME_EMAIL_DOMAIN"
          }
        ],
        "property": "mail"
      },
      {
        "policyRequirements": [
          {
            "policyRequirement": "ACME_VALID_AU_POSTCODE"
          }
        ],
        "property": "postalCode"
      },
      {
        "policyRequirements": [
          {
            "params": {
              "min": 2
            },
            "policyRequirement": "ACME_MIN_LENGTH"
          }
        ],
        "property": "sn"
      },
      {
        "policyRequirements": [
          {
            "policyRequirement": "ACME_VALID_AU_STATE"
          }
        ],
        "property": "stateProvince"
      },
      {
        "policyRequirements": [
          {
            "policyRequirement": "ACME_VALID_AU_PHONE"
          }
        ],
        "property": "telephoneNumber"
      }
    ]
  }
}
```

## Browser Behavior

The `DemoIDMPoliciesReg` journey uses `Attribute Collector` with `validateInputs: true`, so the same IDM policies are enforced before the flow reaches `Create Object`.

Without a `uilocale/en` override, the hosted page shows the raw message keys:

[Raw validation output](screenshots/journey-raw-errors-visible.png)

![Raw validation output](screenshots/journey-raw-errors-visible.png)

[Raw page before submit](screenshots/journey-raw-errors-filled.png)

With [uilocale-en.json](samples/uilocale-en.json) applied, the hosted page renders friendly messages:

[Localized validation output](screenshots/journey-localized-errors-visible.png)

![Localized validation output](screenshots/journey-localized-errors-visible.png)

[Localized page before submit](screenshots/journey-localized-errors-filled.png)

## IDM Configuration Screenshot

The `mail` property configuration in IDM is shown here:

[Mail property validation in IDM](screenshots/idm-mail-validation.png)

![Mail property validation in IDM](screenshots/idm-mail-validation.png)

This is the field that carries the `acme-email-domain` policy attachment in the demo.

## Important Notes

- `config/policy` is a full replacement document. Updates must preserve every custom policy you still want registered.
- `uilocale/en` is optional. Without it, the journey shows the raw fallback key format such as `common.policyValidationMessages.ACME_EMAIL_DOMAIN`.
- If a localized message contains a literal `@`, escape it as `{'@'}`. For example:

```json
"ACME_EMAIL_DOMAIN": "Use an Acme email address that ends in {'@'}acme.com."
```

- Without that escape, the hosted page can fail during rendering.
- The tenant-wide locale file should stay generic enough to make sense anywhere the policy is used.

## Related Documentation

- [Use policies to validate data](https://docs.pingidentity.com/pingoneaic/latest/idm-objects/policies.html)
- [Apply policies to managed objects](https://docs.pingidentity.com/pingoneaic/idm-objects/configuring-default-policy.html)
- [Manage policies over REST](https://docs.pingidentity.com/pingoneaic/idm-objects/policies-over-REST.html)
- [Create and modify managed object types](https://docs.pingidentity.com/pingoneaic/latest/idm-objects/creating-modifying-managed-objects.html)
- [Attribute Collector node](https://docs.pingidentity.com/auth-node-ref/latest/auth-node-attribute-collector.html)
- [Localize hosted pages](https://docs.pingidentity.com/pingoneaic/latest/end-user/localize-login-enduser-pages.html)
- [Localize tenant admin console and hosted pages](https://docs.pingidentity.com/pingoneaic/latest/tenants/tenant-localize.html)
