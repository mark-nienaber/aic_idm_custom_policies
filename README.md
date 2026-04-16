# AIC IDM Custom Policy Validation

This repository shows a way to implement custom IDM validation policies in PingOne Advanced Identity Cloud (AIC) using the native IDM policy registry, and to reuse those same policies in authentication journeys through the Attribute Collector node.

The goal is to keep IDM as the single source of truth for validation, while still surfacing clear, field level error messages on hosted pages during registration and profile update flows.

## Repository contents

- [solution/samples/config-policy.json](solution/samples/config-policy.json): example IDM `config/policy` document that registers custom policies through `globals.additionalPolicies` and `addPolicy(...)`.
- [solution/samples/managed-alpha-user-properties.json](solution/samples/managed-alpha-user-properties.json): example managed object property definitions that attach custom `policyId` values to `alpha_user` properties.
- [solution/samples/test-valid-alpha-user.json](solution/samples/test-valid-alpha-user.json) and [solution/samples/test-invalid-alpha-user.json](solution/samples/test-invalid-alpha-user.json): sample payloads for a successful create and a policy failure.
- [solution/screenshots/](solution/screenshots/): screenshots of the managed object configuration and the hosted journey pages showing custom policy validation in action.

## The pattern

1. Register custom policies in IDM by pushing a `config/policy` document that includes `globals.additionalPolicies` entries. Each entry is a single line of JavaScript that calls `addPolicy(...)` with a `policyId`, a `policyExec` function, and one or more `policyRequirements` keys.
2. Attach those `policyId` values to the relevant properties on `managed/alpha_user` (for example `mail`, `userName`, `givenName`, `sn`, `telephoneNumber`, `accountStatus`) using the standard managed object `policies` array. Parameters such as an allowed email domain can be passed through the `params` object.
3. Use an AIC authentication journey with an Attribute Collector node configured with `validateInputs: true` so collected attributes are validated against IDM policies before the journey reaches Create Object.
4. Provide hosted page localization through `config/uilocale/en` so that policy requirement keys such as `EMAIL_DOMAIN` render as friendly messages. The `@` character must be escaped as `{'@'}` in the message string, otherwise the translated message can fail to render.

With this pattern, direct IDM REST calls, AIC journeys and any other client that writes through the managed object endpoints all see the same custom policy behaviour.

## Example custom policies included

- `email-domain`: requires email addresses to end in an allowed domain such as `@example.com`.
- `username-no-spaces`: rejects usernames that contain whitespace.
- `given-name-required`: requires a non empty first name.
- `surname-min-length`: requires a minimum surname length.
- `telephone-format`: enforces a basic telephone format.
- `account-status-valid`: restricts `accountStatus` to an allowed set of values.
- `phone-required-if-active`: requires a phone number when `accountStatus` is `active`.

## Screenshots

Managed object configuration in the IDM native console:

- [Properties list on alpha_user](solution/screenshots/idm-alpha-user-properties-list.png)
- [mail property details](solution/screenshots/idm-alpha-user-mail-property-details.png)
- [mail property validation with email-domain attached](solution/screenshots/idm-alpha-user-mail-property-validation.png)

Hosted registration journey with the Attribute Collector node:

- [Initial registration page](solution/screenshots/20260410-162557-01-initial.png)
- [Invalid email domain error rendered from the localized policy message](solution/screenshots/20260410-153028-02-invalid-domain-error.png)
- [Raw policy key shown when no uilocale override is in place](solution/screenshots/20260410-154353-no-uilocale-email-domain.png)
- [Page after a successful submit](solution/screenshots/20260410-162557-03-after-success-submit.png)

## Typical validation failure response

When a custom policy fails on a direct IDM REST call, the standard policy validation error payload is returned:

```json
{
  "code": 400,
  "reason": "Bad Request",
  "message": "Policy validation failed",
  "detail": {
    "failedPolicyRequirements": [
      {
        "property": "mail",
        "policyRequirements": [
          {
            "policyRequirement": "EMAIL_DOMAIN"
          }
        ]
      }
    ]
  }
}
```

## Operational notes

- `config/policy` is a full replacement document, not a merge. Every update must include all desired custom policies, not just the latest change.
- The policy functions should be treated as configuration owned code and kept under source control alongside `config-policy.json`.
- `uilocale/en` is tenant wide, so localization messages should be written so they still make sense wherever the policy is used.
- Create Object should remain in journey designs because IDM is still the final write path and the final enforcement point.
- For richer audit evidence, the AIC monitoring log APIs for `idm-access`, `idm-activity` and `idm-core` can be used.

## Related Ping Identity documentation

- [Use policies to validate data](https://docs.pingidentity.com/pingoneaic/latest/idm-objects/policies.html)
- [Apply policies to managed objects](https://docs.pingidentity.com/pingoneaic/idm-objects/configuring-default-policy.html)
- [Manage policies over REST](https://docs.pingidentity.com/pingoneaic/idm-objects/policies-over-REST.html)
- [Create and modify managed object types](https://docs.pingidentity.com/pingoneaic/latest/idm-objects/creating-modifying-managed-objects.html)
- [Attribute Collector node](https://docs.pingidentity.com/auth-node-ref/latest/auth-node-attribute-collector.html)
- [Localize hosted pages](https://docs.pingidentity.com/pingoneaic/latest/end-user/localize-login-enduser-pages.html)
- [Localize tenant admin console and hosted pages](https://docs.pingidentity.com/pingoneaic/latest/tenants/tenant-localize.html)
