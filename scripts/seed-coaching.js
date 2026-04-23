#!/usr/bin/env node
/**
 * seed-coaching.js — insert a fake conversation_feedback row for a given
 * user so you can manually test the feedback-loop injection without
 * running a real chat + rating + analyzer cycle.
 *
 * Usage:
 *   node scripts/seed-coaching.js <email> "<coaching suggestion>" [rating]
 *
 * Example:
 *   node scripts/seed-coaching.js frank@example.com "Keep responses under 30 words. No greetings after turn 1." 2
 *
 * After running, start a new conversation with that user and watch the
 * server log for `[coaching] injected=1 notes: - (2★) Keep responses...`
 * — that confirms the coaching block was added to the system prompt.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../server/db/database');
const User = require('../server/models/User');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/seed-coaching.js <email> "<suggestion>" [rating]');
  console.log('Example: node scripts/seed-coaching.js frank@example.com "Keep responses under 30 words." 2');
  process.exit(1);
}

const email = args[0];
const suggestion = args[1];
const rating = args[2] ? Number(args[2]) : 2;

if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
  console.error(`Rating must be an integer 1-5 (got "${args[2]}")`);
  process.exit(1);
}

const user = User.findByEmail(email);
if (!user) {
  console.error(`No user found with email "${email}". Create the account first via the UI.`);
  process.exit(1);
}

// Create a throw-away conversation row to satisfy the FK.
const convId = `seed-${uuidv4()}`;
db.prepare(`
  INSERT INTO conversations (id, user_id, task_type, status, started_at, ended_at)
  VALUES (?, ?, 'seeded-test', 'ended', datetime('now'), datetime('now'))
`).run(convId, user.id);

// Insert the feedback row with ai_suggestion pre-populated.
const feedbackId = uuidv4();
const now = new Date().toISOString();
db.prepare(`
  INSERT INTO conversation_feedback
    (id, conversation_id, user_id, rating, comment, ai_suggestion, ai_suggestion_generated_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`).run(feedbackId, convId, user.id, rating, '(seeded)', suggestion, now);

console.log(`Seeded feedback for ${email} (user.id=${user.id})`);
console.log(`  rating: ${rating}★`);
console.log(`  suggestion: ${suggestion}`);
console.log(`\nNext: start a new conversation with ${email} and watch the server log for`);
console.log(`  [coaching] user=${user.id} injected=1 notes: - (${rating}★) ${suggestion.slice(0, 60)}...`);
