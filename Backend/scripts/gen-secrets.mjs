#!/usr/bin/env node
/**
 * Generates the cryptographic values Railway needs. Run locally, paste into
 * the Railway variables panel — never commit the output.
 *
 *   node scripts/gen-secrets.mjs
 */
import { randomBytes } from 'crypto';

const key = () => randomBytes(48).toString('base64url');

console.log(`
Paste these into Railway → your backend service → Variables.
Generate a NEW set for each environment; never reuse the dev values.

JWT_SECRET=${key()}
JWT_REFRESH_SECRET=${key()}
INTERNAL_API_KEY=${key()}
SEED_ADMIN_PASSWORD=${randomBytes(16).toString('base64url')}

Store SEED_ADMIN_PASSWORD in a password manager — it is the only way into
the super-admin account, and the seed refuses to run without it in production.
`);
