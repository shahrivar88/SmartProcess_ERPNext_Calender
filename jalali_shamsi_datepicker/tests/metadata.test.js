// Static assertions about versioning, packaging, hooks, CSS tokens and the
// fixture scope, so the 1.6.2 release stays consistent and narrowly scoped.
// Run: node --test jalali_shamsi_datepicker/tests/metadata.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", ".."); // repo root
const APP = path.join(ROOT, "jalali_shamsi_datepicker"); // bench app package dir
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const VERSION = "1.6.2";

test("version is 1.6.2 in the package, the repo root, pyproject and npm metadata", () => {
	assert.match(read("jalali_shamsi_datepicker/__init__.py"), /__version__\s*=\s*['\"]1\.6\.2['\"]/);
	assert.match(read("__init__.py"), /__version__\s*=\s*['\"]1\.6\.2['\"]/);
	const pyproject = read("pyproject.toml");
	assert.match(pyproject, /^version\s*=\s*"1\.6\.2"$/m);
	assert.match(pyproject, /SmartProcess_ERPNext_Calender/);
	assert.match(pyproject, /^Homepage = "https:\/\/github.com\/shahrivar88\/SmartProcess_ERPNext_Calender"$/m);
	assert.match(pyproject, /^Repository = "https:\/\/github.com\/shahrivar88\/SmartProcess_ERPNext_Calender"$/m);
	assert.match(pyproject, /^Upstream = "https:\/\/github.com\/nidyasoft\/jalali_shamsi_datepicker"$/m);
	assert.doesNotMatch(pyproject, /Homepage = ".*nidyasoft/);
	assert.equal(JSON.parse(read("package.json")).version, VERSION);
	const lock = JSON.parse(read("package-lock.json"));
	assert.equal(lock.version, VERSION);
	assert.equal(lock.packages[""].version, VERSION);
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
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/css/custom.css?v=17"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/persian-datepicker.min.js?v=3"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/jalali_core.js?v=6"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/jalali_persian_date_adapter.js?v=3"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/jalali_controls.js?v=18"'));
	const coreIdx = hooks.indexOf("jalali_core.js");
	const adapterIdx = hooks.indexOf("jalali_persian_date_adapter.js");
	const controlsIdx = hooks.indexOf("jalali_controls.js");
	assert.ok(coreIdx !== -1 && adapterIdx !== -1 && controlsIdx !== -1);
	assert.ok(coreIdx < adapterIdx && adapterIdx < controlsIdx, "adapter must load after core and before controls");
	// Vendor assets are untouched since 1.6.0, so their URLs must not change.
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/css/persian-datepicker.min.css"'));
	assert.ok(hooks.includes('"/assets/jalali_shamsi_datepicker/js/persian-date.min.js"'));
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

test("raw Gregorian helper CSS stays app-scoped and out of the form flow", () => {
	const css = read("jalali_shamsi_datepicker/public/css/custom.css");
	// Every rule must be scoped to this app's enabled body class.
	for (const rule of css.replace(/\/\*[\s\S]*?\*\//g, "").split("}")) {
		const selector = rule.split("{")[0].trim();
		if (!selector) continue;
		for (const part of selector.split(",")) {
			assert.match(part, /body\.jalali-calendar-enabled/, "unscoped selector: " + part.trim());
		}
	}
	// Never restyle Frappe's shared wrappers globally; only the app-owned host class.
	assert.doesNotMatch(css, /\.frappe-control\s*\{|\.form-group\s*\{|\.control-input-wrapper\s*\{/);
	assert.match(css, /\.jalali-stored-value-host\s*>\s*\.jalali-stored-value\s*\{[^}]*position:\s*absolute/);
});

test("app Python has no permission bypass, SQL, overrides or doc_events", () => {
	const pyFiles = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory() && entry.name !== "__pycache__") walk(full);
			else if (entry.name.endsWith(".py")) pyFiles.push(full);
		}
	};
	walk(APP);
	assert.ok(pyFiles.length > 5);
	for (const file of pyFiles) {
		const src = fs.readFileSync(file, "utf8");
		const rel = path.relative(ROOT, file).replace(/\\/g, "/");
		assert.doesNotMatch(src, /ignore_permissions/, rel);
		assert.doesNotMatch(src, /override_whitelisted_methods|override_doctype_class|doc_events/, rel);
		if (rel === "jalali_shamsi_datepicker/uninstall.py") {
			// App-owned System Settings residue only. Custom Field.on_trash can leave
			// a tabSingles Check of 1 that re-enables the calendar on reinstall.
			assert.match(src, /frappe\.db\.delete\("Singles", \{"doctype": dt, "field": fieldname\}\)/);
			assert.doesNotMatch(src, /\.sql\(|frappe\.db\.(set_value|truncate|commit)|db_set\(/, rel);
			assert.doesNotMatch(src, /frappe\.db\.delete\((?!"Singles")/, rel);
			continue;
		}
		assert.doesNotMatch(src, /\.sql\(|frappe\.db\.(set_value|delete|truncate|commit)|db_set\(/, rel);
	}
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

test("LICENSE keeps the upstream nidyasoft MIT notice", () => {
	const license = read("LICENSE");
	assert.match(license, /MIT License/);
	assert.match(license, /Copyright \(c\) 2025 nidyasoft/);
	assert.doesNotMatch(license, /Copyright \(c\) 20\d\d SmartProcess/);
});

test("open-source handoff files exist and name the fork plus upstream", () => {
	const required = [
		"README.md",
		"README.en.md",
		"AGENTS.md",
		"CHANGELOG.md",
		"SECURITY.md",
		"CONTRIBUTING.md",
		"SUPPORT.md",
		"THIRD_PARTY_NOTICES.md",
		"docs/ARCHITECTURE.md",
		"docs/DATA_INTEGRITY.md",
		"docs/FRAPPE_COMPATIBILITY.md",
		"docs/TEST_MATRIX.md",
		"docs/INSTALLATION.md",
		"docs/UPGRADE.md",
		"docs/UNINSTALL.md",
		"docs/RELEASE_PROCESS.md",
		"docs/PRODUCTION_DEPLOYMENT.md",
		"docs/ROLLBACK.md",
		"docs/TROUBLESHOOTING.md",
		".agents/skills/jalali-calendar-invariants/SKILL.md",
		".github/workflows/test.yml",
		".github/workflows/security.yml",
		".github/dependabot.yml",
		".semgrep.yml",
		"scripts/check_docs.js",
		"scripts/verify_release_package.py",
	];
	for (const rel of required) {
		assert.ok(fs.existsSync(path.join(ROOT, rel)), "missing " + rel);
	}
	const readme = read("README.md");
	const readmeEn = read("README.en.md");
	for (const text of [readme, readmeEn]) {
		assert.match(text, /nidyasoft\/jalali_shamsi_datepicker/);
		assert.match(text, /SmartProcess_ERPNext_Calender/);
		assert.match(text, /jalali_shamsi_datepicker/);
		assert.match(text, /custom_enable_shamsi_jalali_calendar/);
		assert.match(text, /1821-03-21/);
		assert.match(text, /2221-03-20/);
	}
	assert.doesNotMatch(read("LICENSE"), /READY FOR RELEASE/);
});