// Python jalali.py must match jalali_core.js. Naming hooks stay official tokens.
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "..");
const core = require("../public/js/jalali_core.js");

const DATES = [
	"2025-03-20",
	"2025-03-21",
	"2026-03-20",
	"2026-03-21",
	"2026-11-01",
	"1821-03-21",
	"2221-03-20",
	"1831-03-21",
	"1897-03-20",
	"1930-03-21",
	"1963-03-21",
	"2095-03-20",
];

function pythonJalali(isoDates) {
	const result = spawnSync(
		"python",
		["-c", "from jalali_shamsi_datepicker.jalali import gregorian_to_jalali_string; import sys;\n[print(gregorian_to_jalali_string(line.strip())) for line in sys.stdin if line.strip()]"],
		{
			cwd: ROOT,
			input: isoDates.join("\n") + "\n",
			encoding: "utf8",
		}
	);
	if (result.status !== 0) {
		throw new Error((result.stderr || result.stdout || "python mapping failed").trim());
	}
	return result.stdout.trim().split(/\r?\n/);
}

test("Python naming converter matches jalali_core.js on representative dates", () => {
	const python = pythonJalali(DATES);
	assert.equal(python.length, DATES.length);
	DATES.forEach((iso, index) => {
		assert.equal(python[index], core.gregorianToJalaliString(iso), iso);
	});
});

test("hooks.py registers four official naming_series_variables and no Gregorian tokens", () => {
	const hooks = fs.readFileSync(path.join(ROOT, "jalali_shamsi_datepicker", "hooks.py"), "utf8");
	assert.match(hooks, /naming_series_variables\s*=/);
	assert.match(hooks, /"JYYYY":\s*"jalali_shamsi_datepicker\.naming\.naming_jyyyy"/);
	assert.match(hooks, /"JYY":\s*"jalali_shamsi_datepicker\.naming\.naming_jyy"/);
	assert.match(hooks, /"JMM":\s*"jalali_shamsi_datepicker\.naming\.naming_jmm"/);
	assert.match(hooks, /"JDD":\s*"jalali_shamsi_datepicker\.naming\.naming_jdd"/);
	assert.doesNotMatch(hooks, /"YYYY"|"YY"|"MM"|"DD"|"#####"/);
	assert.doesNotMatch(hooks, /override_whitelisted_methods|override_doctype_class|doc_events/);
});
