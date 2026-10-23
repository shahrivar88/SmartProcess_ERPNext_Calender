// Production calendar engine: patched persian-date must agree with jalali_core
// for every civil day in the supported range. These assertions fail on the
// unpatched vendor (1830 astronomical / 4026 algorithmic disagreements).
// Run: node --test jalali_shamsi_datepicker/tests/jalali_engine.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const jsDir = path.join(__dirname, "..", "public", "js");
const core = require(path.join(jsDir, "jalali_core.js"));
const PersianDate = require(path.join(jsDir, "persian-date.min.js"));
const adapter = require(path.join(jsDir, "jalali_persian_date_adapter.js"));

assert.equal(PersianDate.__jalaliCoreAdapter, undefined);
const created = adapter.createIsolatedConstructor(PersianDate, core);
assert.equal(created.ok, true);
const Isolated = created.constructor;
assert.equal(PersianDate.__jalaliCoreAdapter, undefined);
assert.equal(Isolated.__jalaliCoreAdapter, true);

function pad(n) {
	return String(n).padStart(2, "0");
}

function jalaliText(parts) {
	return parts[0] + "/" + pad(parts[1]) + "/" + pad(parts[2]);
}

function patchedFromGregorian(gy, gm, gd, hour, minute, second) {
	return new Isolated(new Date(gy, gm - 1, gd, hour, minute, second, 0));
}

const ANCHORS = {
	"1821-03-21": "1200/01/01",
	"1831-03-20": "1209/12/29",
	"1831-03-21": "1210/01/01",
	"1897-03-20": "1276/01/01",
	"1930-03-21": "1309/01/01",
	"1963-03-21": "1342/01/01",
	"2025-03-20": "1403/12/30",
	"2026-03-20": "1404/12/29",
	"2026-03-21": "1405/01/01",
	"2095-03-20": "1474/01/01",
	"2221-03-20": "1599/12/29",
};

const DIVERGENT_VENDOR_DAYS = [
	"1209/12/30",
	"1275/12/30",
	"1308/12/30",
	"1341/12/30",
	"1473/12/30",
];

test("adapter is isolated: global vendor stays raw while the subclass matches core", () => {
	const raw = new PersianDate(new Date(1831, 2, 21, 12, 0, 0)).toArray();
	assert.equal(jalaliText(raw), "1209/12/30");
	assert.equal(new PersianDate([1209, 1, 1]).isLeapYear(), true);
	const again = adapter.createIsolatedConstructor(PersianDate, core);
	assert.equal(again.ok, true);
	assert.notEqual(again.constructor, Isolated);
	assert.equal(PersianDate.__jalaliCoreAdapter, undefined);
	assert.equal(typeof core.gregorianToJalaliString, "function");
});

test("focused leap-pair days that the raw vendor labels wrong now match the core", () => {
	for (const [iso, jalali] of Object.entries(ANCHORS)) {
		const [gy, gm, gd] = iso.split("-").map(Number);
		const pd = patchedFromGregorian(gy, gm, gd, 12, 0, 0);
		assert.equal(jalaliText(pd.toArray()), jalali, iso);
		assert.equal(core.gregorianToJalaliString(iso), jalali, iso);
		const parsed = core.parseJalaliInput(jalali);
		assert.equal(parsed.valid, true, jalali);
		assert.equal(parsed.gregorian, iso, jalali);
	}
	assert.equal(new Isolated([1209, 12, 1]).daysInMonth(), 29);
	assert.equal(new Isolated([1210, 12, 1]).daysInMonth(), 30);
	assert.equal(new Isolated([1403, 12, 1]).daysInMonth(), 30);
	assert.equal(new Isolated([1404, 12, 1]).daysInMonth(), 29);
	for (const invalid of DIVERGENT_VENDOR_DAYS) {
		assert.equal(core.parseJalaliInput(invalid).valid, false, invalid);
		const [jy, jm, jd] = invalid.split("/").map(Number);
		assert.equal(new Isolated([jy, jm, 1]).daysInMonth() < jd, true, invalid);
	}
});

test("Date and Datetime keep the clock on a former divergent day", () => {
	const pd = patchedFromGregorian(1831, 3, 21, 14, 30, 5);
	assert.equal(jalaliText(pd.toArray()), "1210/01/01");
	assert.equal(pd.hour(), 14);
	assert.equal(pd.minute(), 30);
	assert.equal(pd.second(), 5);
	const back = new Isolated([1210, 1, 1, 14, 30, 5]).toCalendar("gregorian").toArray();
	assert.deepEqual(back.slice(0, 6), [1831, 3, 21, 14, 30, 5]);
});

test("leap years 1200-1599 match the core, including both endpoints", () => {
	for (let y = 1200; y <= 1599; y++) {
		assert.equal(
			new Isolated([y, 1, 1]).isLeapYear(),
			core.isLeapJalaliYear(y),
			String(y)
		);
		assert.equal(
			new Isolated([y, 12, 1]).daysInMonth(),
			core.jalaliMonthLength(y, 12),
			String(y)
		);
	}
});

test("every supported civil day round-trips through the patched picker engine", () => {
	const start = core.jalaliToGregorianString(1200, 1, 1);
	const end = core.jalaliToGregorianString(1599, 12, core.jalaliMonthLength(1599, 12));
	assert.equal(start, "1821-03-21");
	assert.equal(end, "2221-03-20");
	const day = new Date(Date.UTC(1821, 2, 21, 12));
	const last = Date.UTC(2221, 2, 20, 12);
	let days = 0;
	let previous = "";
	while (day.getTime() <= last) {
		const iso = day.toISOString().slice(0, 10);
		const [gy, gm, gd] = iso.split("-").map(Number);
		const coreText = core.gregorianToJalaliString(iso);
		const displayed = jalaliText(patchedFromGregorian(gy, gm, gd, 12, 0, 0).toArray());
		assert.equal(displayed, coreText, iso);
		const selected = core.parseJalaliInput(displayed);
		assert.equal(selected.valid, true, displayed);
		assert.equal(selected.gregorian, iso, displayed);
		const [jy, jm, jd] = coreText.split("/").map(Number);
		const stored = new Isolated([jy, jm, jd, 12, 0, 0, 0]).toCalendar("gregorian").toArray();
		assert.equal(stored[0] + "-" + pad(stored[1]) + "-" + pad(stored[2]), iso, coreText);
		assert.ok(coreText > previous, iso);
		previous = coreText;
		days += 1;
		day.setUTCDate(day.getUTCDate() + 1);
	}
	assert.equal(days, 146097);
});

test("civil mapping and clocks stay exact in UTC, Asia/Tehran and America/New_York", () => {
	const script = `
		const core = require(${JSON.stringify(path.join(jsDir, "jalali_core.js"))});
		const PD = require(${JSON.stringify(path.join(jsDir, "persian-date.min.js"))});
		const Isolated = require(${JSON.stringify(path.join(jsDir, "jalali_persian_date_adapter.js"))}).createIsolatedConstructor(PD, core).constructor;
		const pad = (n) => String(n).padStart(2, "0");
		const samples = ${JSON.stringify([
			...Object.keys(ANCHORS),
			"2026-03-08",
			"2026-11-01",
			"2025-03-09",
			"2025-11-02",
		])};
		for (const iso of samples) {
			const [gy, gm, gd] = iso.split("-").map(Number);
			const coreText = core.gregorianToJalaliString(iso);
			for (const hour of [0, 1, 3, 12, 23]) {
				const local = new Date(gy, gm - 1, gd, hour, 30, 5);
				if (local.getFullYear() !== gy || local.getMonth() !== gm - 1 || local.getDate() !== gd) {
					console.error("skipped-nonexistent", iso, hour, process.env.TZ);
					continue;
				}
				const pd = new Isolated(local);
				const got = pd.toArray();
				const text = got[0] + "/" + pad(got[1]) + "/" + pad(got[2]);
				if (text !== coreText) {
					console.error("day", iso, "hour", hour, "got", text, "core", coreText);
					process.exit(2);
				}
				if (got[3] !== local.getHours() || got[4] !== 30 || got[5] !== 5) {
					console.error("time", iso, hour, got.slice(3, 6));
					process.exit(3);
				}
			}
		}
	`;
	for (const tz of ["UTC", "Asia/Tehran", "America/New_York"]) {
		const result = spawnSync(process.execPath, ["-e", script], {
			env: { ...process.env, TZ: tz },
			encoding: "utf8",
		});
		assert.equal(result.status, 0, tz + "\n" + result.stdout + result.stderr);
	}
});
