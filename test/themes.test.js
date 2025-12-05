// Orbital Drift — tests for theme configuration structure and persistence.
// Structure checks are static (read config.js as text) because config.js
// targets the browser (window/localStorage) and cannot be imported freely.
// Run with: npm test  (node --test test/)

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG_SRC = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');

const REQUIRED_THEME_KEYS = ['neon-classic', 'acid', 'sunset', 'ocean'];
const REQUIRED_THEME_FIELDS = [
  'name',
  'background',
  'sphereColors',
  'orbitColor',
  'obstacleColor',
  'laserColor',
  'narrowColor',
  'gapGlowColor',
];

function themeBlockFor(key) {
  const re = new RegExp(`['"]?${key}['"]?\\s*:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`);
  const m = CONFIG_SRC.match(re);
  return m ? m[1] : null;
}

test('config source defines all 4 theme keys', () => {
  for (const key of REQUIRED_THEME_KEYS) {
    assert.ok(
      new RegExp(`['"]?${key}['"]?\\s*:`).test(CONFIG_SRC),
      `missing theme key '${key}' in config.js`
    );
  }
});

test('config source declares defaultTheme', () => {
  assert.match(CONFIG_SRC, /defaultTheme\s*:/);
});

test('each theme block declares every required field', () => {
  for (const key of REQUIRED_THEME_KEYS) {
    const block = themeBlockFor(key);
    assert.ok(block, `could not locate block for theme '${key}'`);
    for (const field of REQUIRED_THEME_FIELDS) {
      assert.match(
        block,
        new RegExp(`^\\s*${field}:`, 'm'),
        `theme '${key}' is missing required field '${field}'`
      );
    }
  }
});

test('defaultTheme matches one of the defined theme keys', () => {
  const m = CONFIG_SRC.match(/defaultTheme\s*:\s*['"]([^'"]+)['"]/);
  assert.ok(m, 'defaultTheme literal not found');
  assert.ok(
    REQUIRED_THEME_KEYS.includes(m[1]),
    `defaultTheme '${m[1]}' is not among the defined themes`
  );
});

// Polyfill browser globals BEFORE requiring config.js so that
// getSelectedTheme/setSelectedTheme can run under Node.
const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  },
};

const { CONFIG, THEME_STORAGE_KEY, isValidThemeId, getSelectedTheme, setSelectedTheme } = require('../config.js');

test('isValidThemeId returns true for every defined theme id', () => {
  for (const key of REQUIRED_THEME_KEYS) {
    assert.strictEqual(isValidThemeId(key, CONFIG.themes), true);
  }
});

test('isValidThemeId returns false for unknown, empty and null ids', () => {
  assert.strictEqual(isValidThemeId('no-such-theme', CONFIG.themes), false);
  assert.strictEqual(isValidThemeId('', CONFIG.themes), false);
  assert.strictEqual(isValidThemeId(null, CONFIG.themes), false);
  assert.strictEqual(isValidThemeId(undefined, CONFIG.themes), false);
});

test('isValidThemeId ignores inherited object members', () => {
  assert.strictEqual(isValidThemeId('constructor', CONFIG.themes), false);
  assert.strictEqual(isValidThemeId('toString', CONFIG.themes), false);
});

test('isValidThemeId returns false when the themes table is missing or empty', () => {
  assert.strictEqual(isValidThemeId('neon-classic', undefined), false);
  assert.strictEqual(isValidThemeId('neon-classic', {}), false);
});

test('getSelectedTheme falls back to defaultTheme when storage is empty', () => {
  storage.clear();
  assert.strictEqual(getSelectedTheme(), CONFIG.defaultTheme);
});

test('getSelectedTheme returns a stored valid theme id', () => {
  storage.clear();
  setSelectedTheme('ocean');
  assert.strictEqual(getSelectedTheme(), 'ocean');
});

test('getSelectedTheme falls back to defaultTheme when storage holds an invalid id', () => {
  storage.clear();
  storage.set(THEME_STORAGE_KEY, 'no-such-theme');
  assert.strictEqual(getSelectedTheme(), CONFIG.defaultTheme);
});

test('setSelectedTheme ignores invalid theme ids and writes nothing', () => {
  storage.clear();
  setSelectedTheme('nope');
  assert.strictEqual(storage.size, 0);
});
