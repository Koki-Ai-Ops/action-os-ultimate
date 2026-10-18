import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

test('handoff lists metadata without copying secret contents', () => {
  const root = mkdtempSync(join(tmpdir(), 'ai-handoff-test-'));
  const script = fileURLToPath(new URL('./ai-handoff.mjs', import.meta.url));
  const git = (...args) => execFileSync('git', ['-C', root, ...args], {stdio:'ignore'});
  try {
    execFileSync('git', ['init', '-q', root], {stdio:'ignore'});
    writeFileSync(join(root, 'README.md'), 'initial\n');
    git('add', 'README.md');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'initial');
    writeFileSync(join(root, 'README.md'), 'modified\n');
    writeFileSync(join(root, '.env'), 'SUPER_SECRET_VALUE=do_not_copy\n');
    execFileSync(process.execPath, [script], {cwd:root, stdio:'pipe'});
    const memo = readFileSync(join(root, '.git', 'AI_HANDOFF.md'), 'utf8');
    assert.match(memo, /README\.md/);
    assert.match(memo, /手動で補足する項目/);
    assert.doesNotMatch(memo, /SUPER_SECRET_VALUE|do_not_copy|\.env/);
  } finally {
    rmSync(root, {recursive:true, force:true});
  }
});
