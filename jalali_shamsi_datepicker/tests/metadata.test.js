// Static assertions about versioning, packaging, hooks, CSS tokens and the
// fixture scope, so the 1.6.0 release stays consistent and narrowly scoped.
// Run: node --test jalali_shamsi_datepicker/tests/metadata.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", ".."); // repo root
const APP = path.join(ROOT, "jalali_shamsi_datepicker"); // bench app package dir
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const VERSION = "1.6.0";

test("version is 1.6.0 in the package, the repo root and pyproject", () => {
	assert.match(read("jalali_shamsi_datepicker/__init__.py"), /__version__\s*=\s*['\"]1\.6\.0['\"]/);
	assert.match(read("__init__.py"), /__version__\s*=\s*['\"]1\.6\.0['\"]/);
	const pyproject = read("pyproject.toml");
	assert.match(pyproject, /^version\s*=\s*"1\.6\.0"$/m);
	assert.match(pyproject, /SmartProcess_ERPNext_Calender/);
	assert.doesNotMatch(pyproject, /nidyasoft/);
});

test("requirements.txt stays comment-only so setup.py gets no fake deps", () => {
	const req = read("requirements.txt");
	for (const line of req.split(/\r?\n/)) {
		if (line.trim()) assert.ok(line.trim().startsWith("#"), "unexpected requirement line: " + line);
	}
	const setup = read("setup.py");
	assert.match(setup, /not line\.strip\(\)\.startswith\("#"\)/);
	assert.match(setup, /from jalali_shamsi_datepicker import __version__/);
});

test("hooks.py bumps asset query strings and keeps fixture scope narrow", () => {
	const hooks = read("jalali_shamsi_datepicker/hooks.py");
	for (const v of ["?v=16", "?v=2", "?v=13"]) {
		assert.ok(hooks.includes(v), "missing asset bump " + v);
	}
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/css/custom.css?v=16"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/jalali_core.js?v=2"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/jalali_controls.js?v=13"'));
	// Fixture filters must stay pinned to this app's single Custom Field.
	const fixtureIdx = hooks.indexOf("fixtures =");
	assert.ok(fixtureIdx !== -1);
	const fixtureBlock = hooks.slice(fixtureIdx);
	assert.match(fixtureBlock, /\["dt", "=", "System Settings"\]/);
	assert.match(fixtureBlock, /\["fieldname", "=", "custom_enable_shamsi_jalali_calendar"\]/);
	// No other app's assets may be loaded through this app's hooks.
	assert.doesNotMatch(hooks, /home_manager|whatsapp|telegram/i);
});

test("custom.css uses theme tokens with a safe fallback, never raw hex values", () => {
	const css = read("jalali_shamsi_datepicker/public/css/custom.css");
	const rawDecl = /:\s*#(2490ef|e11d48|be123c)/;
	assert.doesNotMatch(css, rawDecl, "hard-coded colours must be wrapped in var() fallbacks");
	assert.ok(css.includes("var(--primary-color, var(--primary, #2490ef))"));
	assert.ok(css.includes("var(--red-500, #e11d48)"));
	assert.ok(css.includes("var(--red-600, #be123c)"));
	assert.match(css, /--primary-color\s*\/\s*--primary/);
	assert.match(css, /--red-500\s*\/\s*--red-600/);
});

test("custom_field fixture contains exactly the in-app System Settings switch", () => {
	const fixture = JSON.parse(read("jalali_shamsi_datepicker/fixtures/custom_field.json"));
	assert.equal(fixture.length, 1);
	assert.equal(fixture[0].doctype, "Custom Field");
	assert.equal(fixture[0].dt, "System Settings");
	assert.equal(fixture[0].fieldname, "custom_enable_shamsi_jalali_calendar");
	assert.equal(fixture[0].fieldtype, "Check");
	assert.equal(fixture[0].default, "0");
});