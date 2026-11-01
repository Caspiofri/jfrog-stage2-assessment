const moment = require('moment');

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

// Walk own enumerable keys at any depth. JSON.parse stores a "__proto__"
// payload key as an OWN property, so Object.keys surfaces it here. We match
// the key name before dereferencing it, so we never trip the __proto__ getter.
function containsForbiddenKey(value, seen = new Set()) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      return true;
    }
    if (containsForbiddenKey(value[key], seen)) {
      return true;
    }
  }
  return false;
}

// Reject any request whose parsed body carries a forbidden key at any depth.
module.exports = function rejectProtoKeys(req, res, next) {
  if (containsForbiddenKey(req.body)) {
    return res.status(400).json({
      success: false,
      error: 'Request body contains a forbidden key (__proto__, constructor, or prototype)',
      timestamp: moment().toISOString()
    });
  }
  next();
};

module.exports.containsForbiddenKey = containsForbiddenKey;
