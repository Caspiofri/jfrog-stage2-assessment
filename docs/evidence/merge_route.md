# Code excerpt — the PUT /api/users/:id update route, before vs after

**What this shows:** the vulnerable `_.merge` sink at 31d8090 versus the hardened
route and the guard middleware on stage2/final. Code only, with line numbers.

**Branch/commits:** before = 31d8090; after = stage2/final (c545cc4)
**Date:** 2026-11-01T20:02:33+02:00
**Commands:**
```
git show 31d8090:src/routes/users.js        # lines 130-155
git show stage2/final:src/routes/users.js   # lines 119-175 (the PUT route)
git show stage2/final:src/middleware/rejectProtoKeys.js
```

---

## Before — src/routes/users.js @ 31d8090, lines 130-155
```js
 130      });
 131    }
 132
 133    // Validate email if provided
 134    if (email && !validator.isEmail(email)) {
 135      return res.status(400).json({
 136        success: false,
 137        error: 'Invalid email format',
 138        timestamp: moment().toISOString()
 139      });
 140    }
 141
 142    // Update user using lodash merge (vulnerable version)
 143    const updatedUser = _.merge(users[userIndex], {
 144      username: username || users[userIndex].username,
 145      email: email || users[userIndex].email,
 146      updatedAt: moment().toISOString()
 147    });
 148
 149    res.json({
 150      success: true,
 151      data: formatUserData(updatedUser),
 152      message: 'User updated successfully',
 153      timestamp: moment().toISOString()
 154    });
 155  });
```

## After — src/routes/users.js @ stage2/final, lines 119-175 (the PUT route)
```js
 119  router.put('/:id', (req, res) => {
 120    const userId = parseInt(req.params.id);
 121    const { username, email } = req.body;
 122
 123    const userIndex = _.findIndex(users, { id: userId });
 124
 125    if (userIndex === -1) {
 126      return res.status(404).json({
 127        success: false,
 128        error: 'User not found',
 129        timestamp: moment().toISOString()
 130      });
 131    }
 132
 133    // Validate email if provided
 134    if (email && !validator.isEmail(email)) {
 135      return res.status(400).json({
 136        success: false,
 137        error: 'Invalid email format',
 138        timestamp: moment().toISOString()
 139      });
 140    }
 141
 142    // Build the update from an explicit allow-list of fields with string type
 143    // checks, instead of deep-merging attacker-controlled request data. This
 144    // keeps nested/crafted keys (e.g. __proto__, constructor) out of the sink.
 145    if (username !== undefined && typeof username !== 'string') {
 146      return res.status(400).json({
 147        success: false,
 148        error: 'username must be a string',
 149        timestamp: moment().toISOString()
 150      });
 151    }
 152    if (email !== undefined && typeof email !== 'string') {
 153      return res.status(400).json({
 154        success: false,
 155        error: 'email must be a string',
 156        timestamp: moment().toISOString()
 157      });
 158    }
 159
 160    const updatedUser = users[userIndex];
 161    if (typeof username === 'string') {
 162      updatedUser.username = username;
 163    }
 164    if (typeof email === 'string') {
 165      updatedUser.email = email;
 166    }
 167    updatedUser.updatedAt = moment().toISOString();
 168
 169    res.json({
 170      success: true,
 171      data: formatUserData(updatedUser),
 172      message: 'User updated successfully',
 173      timestamp: moment().toISOString()
 174    });
 175  });
```

## Middleware — src/middleware/rejectProtoKeys.js @ stage2/final
```js
   1  const moment = require('moment');
   2
   3  const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];
   4
   5  // Walk own enumerable keys at any depth. JSON.parse stores a "__proto__"
   6  // payload key as an OWN property, so Object.keys surfaces it here. We match
   7  // the key name before dereferencing it, so we never trip the __proto__ getter.
   8  function containsForbiddenKey(value, seen = new Set()) {
   9    if (value === null || typeof value !== 'object') {
  10      return false;
  11    }
  12    if (seen.has(value)) {
  13      return false;
  14    }
  15    seen.add(value);
  16
  17    for (const key of Object.keys(value)) {
  18      if (FORBIDDEN_KEYS.includes(key)) {
  19        return true;
  20      }
  21      if (containsForbiddenKey(value[key], seen)) {
  22        return true;
  23      }
  24    }
  25    return false;
  26  }
  27
  28  // Reject any request whose parsed body carries a forbidden key at any depth.
  29  module.exports = function rejectProtoKeys(req, res, next) {
  30    if (containsForbiddenKey(req.body)) {
  31      return res.status(400).json({
  32        success: false,
  33        error: 'Request body contains a forbidden key (__proto__, constructor, or prototype)',
  34        timestamp: moment().toISOString()
  35      });
  36    }
  37    next();
  38  };
  39
  40  module.exports.containsForbiddenKey = containsForbiddenKey;
```
