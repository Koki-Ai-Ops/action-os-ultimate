import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(html, /<html\s+lang="ja"/i, 'Japanese document language is declared');
assert.match(html, /name="viewport"/i, 'mobile viewport is configured');
assert.match(html, /localStorage/, 'local-only persistence remains present');
assert.match(html, /外部送信なし/, 'UI discloses the local-only privacy contract');
assert.match(html, /function\s+esc\s*\(/, 'HTML escaping helper remains present');
assert.match(html, /id="runTestsBtn"/, 'in-app self-test entry point remains present');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
assert.ok(scripts.length > 0, 'embedded application script exists');
for (const [index, script] of scripts.entries()) {
  assert.doesNotThrow(() => new Function(script), `embedded script ${index + 1} parses`);
}

const forbiddenNetwork = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bEventSource\b/,
  /\bsendBeacon\s*\(/,
];
for (const pattern of forbiddenNetwork) {
  assert.doesNotMatch(html, pattern, `local-only app must not add network primitive ${pattern}`);
}

const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{10,}\b/i,
  /\bservice[_-]?role\b/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
for (const pattern of secretPatterns) {
  assert.doesNotMatch(html, pattern, `public static app must not contain secret-like material ${pattern}`);
}

const requiredIds = [
  'mainInput',
  'analyzeBtn',
  'resultCard',
  'saveBtn',
  'libraryList',
  'exportBtn',
  'importInput',
  'clearAllBtn',
];
for (const id of requiredIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `required UI control #${id} exists`);
}

console.log(`Action OS static audit passed: ${requiredIds.length} critical controls, privacy boundary, secret scan, and JS syntax.`);
