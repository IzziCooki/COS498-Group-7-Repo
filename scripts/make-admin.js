#!/usr/bin/env node
/**
 * make-admin.js — promote (or demote) a user to admin.
 *
 * Usage:
 *   node scripts/make-admin.js <email>            # grant admin
 *   node scripts/make-admin.js <email> --revoke   # revoke admin
 *
 * There is no HTTP endpoint that does this on purpose — admin promotion
 * must happen out of band, so a compromised session can never escalate
 * itself.
 */

const User = require('../server/models/User');

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log('Usage: node scripts/make-admin.js <email> [--revoke]');
  process.exit(1);
}

const email = args[0];
const revoke = args.includes('--revoke');

const user = User.findByEmail(email);
if (!user) {
  console.error(`No user found with email "${email}". They need to sign up first.`);
  process.exit(1);
}

User.setAdmin(user.id, !revoke);
const after = User.findById(user.id);
console.log(
  revoke
    ? `Revoked admin from ${email} (id=${user.id})`
    : `Granted admin to ${email} (id=${user.id})`
);
console.log(`is_admin is now ${after.is_admin}`);
