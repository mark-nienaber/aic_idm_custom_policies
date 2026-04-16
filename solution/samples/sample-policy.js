/*
 * Sample custom IDM validation policies.
 *
 * These functions are written in readable form. To deploy them, each
 * addPolicy(...) call and its matching function definition must be
 * concatenated into a single line and added as a string entry to
 * globals.additionalPolicies in config/policy. See config-policy.json
 * in this directory for the deployed form.
 */

/*
 * Validates that an email address ends with the configured domain.
 * Defaults to @acme.com when params.domain is not supplied.
 */
addPolicy({
  policyId: "acme-email-domain",
  policyExec: "acmeEmailDomain",
  validateOnlyIfPresent: true,
  policyRequirements: ["ACME_EMAIL_DOMAIN"]
});
function acmeEmailDomain(fullObject, value, params, property) {
  if (value === null || typeof value === "undefined" || String(value).length === 0) {
    return [];
  }
  var domain = (params && params.domain) ? String(params.domain) : "@acme.com";
  if (domain.charAt(0) !== "@") {
    domain = "@" + domain;
  }
  domain = domain.toLowerCase();
  var normalizedValue = String(value).toLowerCase();
  if (normalizedValue.length < domain.length || normalizedValue.substring(normalizedValue.length - domain.length) !== domain) {
    return [{ policyRequirement: "ACME_EMAIL_DOMAIN" }];
  }
  return [];
}

/*
 * Validates an Australian phone number.
 * Accepts local format (for example 0412345678, 0298765432) and
 * international format (+61412345678). Whitespace, hyphens and
 * parentheses are tolerated.
 * Valid area codes: 02 (NSW/ACT), 03 (VIC/TAS), 04 (mobile),
 * 07 (QLD), 08 (SA/NT/WA).
 */
addPolicy({
  policyId: "acme-valid-au-phone",
  policyExec: "acmeValidAuPhone",
  validateOnlyIfPresent: true,
  policyRequirements: ["ACME_VALID_AU_PHONE"]
});
function acmeValidAuPhone(fullObject, value, params, property) {
  if (value === null || typeof value === "undefined" || String(value).length === 0) {
    return [];
  }
  var normalized = String(value).replace(/[\s()-]/g, "");
  if (/^\+61[2-478]\d{8}$/.test(normalized)) {
    return [];
  }
  if (/^0[2-478]\d{8}$/.test(normalized)) {
    return [];
  }
  return [{ policyRequirement: "ACME_VALID_AU_PHONE" }];
}

/*
 * Validates an Australian state or territory abbreviation.
 * Accepts upper or lower case. Leading and trailing whitespace
 * is tolerated.
 */
addPolicy({
  policyId: "acme-valid-au-state",
  policyExec: "acmeValidAuState",
  validateOnlyIfPresent: true,
  policyRequirements: ["ACME_VALID_AU_STATE"]
});
function acmeValidAuState(fullObject, value, params, property) {
  if (value === null || typeof value === "undefined" || String(value).length === 0) {
    return [];
  }
  var allowed = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
  var normalized = String(value).trim().toUpperCase();
  for (var i = 0; i < allowed.length; i++) {
    if (normalized === allowed[i]) {
      return [];
    }
  }
  return [{ policyRequirement: "ACME_VALID_AU_STATE" }];
}

/*
 * Validates an Australian postcode.
 * Australian postcodes are exactly four digits. Leading and
 * trailing whitespace is tolerated.
 */
addPolicy({
  policyId: "acme-valid-au-postcode",
  policyExec: "acmeValidAuPostcode",
  validateOnlyIfPresent: true,
  policyRequirements: ["ACME_VALID_AU_POSTCODE"]
});
function acmeValidAuPostcode(fullObject, value, params, property) {
  if (value === null || typeof value === "undefined" || String(value).length === 0) {
    return [];
  }
  var normalized = String(value).trim();
  if (!/^\d{4}$/.test(normalized)) {
    return [{ policyRequirement: "ACME_VALID_AU_POSTCODE" }];
  }
  return [];
}

/*
 * Validates that a string or array value meets a minimum length.
 * Requires params.min (number). Non string, non array values are
 * ignored so the policy can be attached to mixed type schemas
 * without side effects.
 */
addPolicy({
  policyId: "acme-min-length",
  policyExec: "acmeMinLength",
  validateOnlyIfPresent: true,
  policyRequirements: ["ACME_MIN_LENGTH"]
});
function acmeMinLength(fullObject, value, params, property) {
  var min = (params && typeof params.min === "number") ? params.min : 0;
  if (value === null || typeof value === "undefined") {
    return [];
  }
  var length;
  if (typeof value === "string") {
    length = value.length;
  } else if (value instanceof Array) {
    length = value.length;
  } else {
    return [];
  }
  if (length < min) {
    return [{ policyRequirement: "ACME_MIN_LENGTH", params: { min: min } }];
  }
  return [];
}

/*
 * Validates that a string or array value does not exceed a maximum length.
 * Requires params.max (number). Non string, non array values are ignored.
 */
addPolicy({
  policyId: "acme-max-length",
  policyExec: "acmeMaxLength",
  validateOnlyIfPresent: true,
  policyRequirements: ["ACME_MAX_LENGTH"]
});
function acmeMaxLength(fullObject, value, params, property) {
  var max = (params && typeof params.max === "number") ? params.max : 0;
  if (value === null || typeof value === "undefined") {
    return [];
  }
  var length;
  if (typeof value === "string") {
    length = value.length;
  } else if (value instanceof Array) {
    length = value.length;
  } else {
    return [];
  }
  if (length > max) {
    return [{ policyRequirement: "ACME_MAX_LENGTH", params: { max: max } }];
  }
  return [];
}
