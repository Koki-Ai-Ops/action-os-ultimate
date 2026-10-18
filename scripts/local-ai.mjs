#!/usr/bin/env node
// Local-only integration: no installer, accounts, remote APIs or automatic commits.
import { spawn, spawnSync } from 'node:child_process';

const model = 'qwen2.5-coder:7b';
const usage = `Ollama + Aider local coding (PC only)
  node scripts/local-ai.mjs check  - show missing requirements
  node scripts/local-ai.mjs start  - launch Aider with a local Ollama model

Prerequisites (follow official installation instructions):
  https://github.com/ollama/ollama
  https://github.com/Aider-AI/aider
  ollama pull ${model}

Run Ollama on localhost (11434) first, then run 'start'.
Review edits and run tests before committing. This does NOT bypass model
availability, RAM limits, internet needed for model download, or age limits.`;

const executable = (name, args) => spawnSync(name, args, {
  encoding: 'utf8',
  timeout: 12000,
  shell: process.platform === 'win32',
  windowsHide: true
});

function check() {
  const ollama = executable('ollama', ['--version']);
  const aider = executable('aider', ['--version']);
  const modelList = ollama.status === 0 ? executable('ollama', ['list']) : {status: 1};
  const available = modelList.status === 0 &&
    (modelList.stdout || '').split('\n').some(line => line.trim().split(/\s+/)[0] === model);
  console.log('Ollama installed: ' + (ollama.status === 0 ? 'yes' : 'no'));
  console.log('Aider installed: ' + (aider.status === 0 ? 'yes' : 'no'));
  console.log('Ollama local model ' + model + ': ' + (available ? 'yes' : 'not found / server stopped'));
  console.log('No AI accounts or keys are configured by this script.');
  return ollama.status === 0 && aider.status === 0 && available;
}

const command = process.argv[2] || 'help';
if (command === 'help' || command === '--help') {
  console.log(usage);
} else if (command === 'check') {
  if (!check()) process.exitCode = 1;
} else if (command === 'start') {
  if (!check()) {
    console.error('\nSet up the missing requirements first. See: node scripts/local-ai.mjs help');
    process.exitCode = 1;
  } else {
    const child = spawn('aider', [
      '--model', 'ollama_chat/' + model,
      '--no-auto-commits',
      '--no-analytics'
    ], {
      stdio: 'inherit',
      env: {...process.env, OLLAMA_API_BASE: 'http://127.0.0.1:11434'},
      shell: process.platform === 'win32',
      windowsHide: false
    });
    child.on('error', err => {
      console.error('Cannot launch Aider: ' + err.message);
      process.exitCode = 1;
    });
    child.on('exit', (code, signal) => {
      if (signal) console.error('Aider exited on signal: ' + signal);
      process.exitCode = code === 0 ? 0 : 1;
    });
  }
} else {
  console.error('Unknown command: ' + command);
  console.log(usage);
  process.exitCode = 2;
}
