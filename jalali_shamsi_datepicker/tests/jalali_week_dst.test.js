// DST week arithmetic: startOf/endOf("week") must move civil days, not 864e5 ms.
// 864e5 is 24 elapsed hours and is not a civil day across DST transitions.
// Run: node --test jalali_shamsi_datepicker/tests/jalali_week_dst.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ZONES = ["UTC", "Asia/Tehran", "America/New_York"];

function probeInZone(tz) {
	const script = `
const path = require("path");
const jsDir = ${JSON.stringify(path.join(__dirname, "..", "public", "js"))};
const core = require(path.join(jsDir, "jalali_core.js"));
const PersianDate = require(path.join(jsDir, "persian-date.min.js"));
const adapter = require(path.join(jsDir, "jalali_persian_date_adapter.js"));
const Isolated = adapter.createIsolatedConstructor(PersianDate, core).constructor;
function pad(n) { return String(n).padStart(2, "0"); }
function civil(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function clock(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }
function shiftCivil(d, days) { const n = new Date(d.getTime()); n.setDate(n.getDate() + days); return n; }
const samples = ${JSON.stringify([
		["2026-03-07", 0, 0, 0],
		["2026-03-08", 0, 0, 0],
		["2026-03-09", 0, 0, 0],
		["2026-03-09", 12, 0, 0],
		["2026-03-11", 0, 0, 0],
		["2026-11-01", 0, 0, 0],
		["2026-11-01", 1, 30, 0],
		["2026-11-02", 0, 0, 0],
		["2026-11-03", 0, 0, 0],
		["2021-03-21", 0, 0, 0],
		["2021-03-22", 0, 0, 0],
		["2026-03-21", 0, 0, 0],
	])};
const rows = [];
for (const [iso, h, mi, s] of samples) {
	const [gy, gm, gd] = iso.split("-").map(Number);
	const local = new Date(gy, gm - 1, gd, h, mi, s, 0);
	const inst = new Isolated(local);
	const weekday = inst.calendar().weekday;
	const start = inst.startOf("week");
	const end = inst.endOf("week");
	const expectedStart = shiftCivil(local, -(weekday - 1));
	const expectedEnd = shiftCivil(expectedStart, 6);
	const first = new Isolated([inst.year(), inst.month(), 1]);
	rows.push({
		iso, clock: clock(local), weekday,
		startCivil: civil(new Date(start.valueOf())),
		startClock: clock(new Date(start.valueOf())),
		expectedStartCivil: civil(expectedStart),
		expectedStartClock: clock(expectedStart),
		endCivil: civil(new Date(end.valueOf())),
		endClock: clock(new Date(end.valueOf())),
		expectedEndCivil: civil(expectedEnd),
		firstWeekDay: first.day(),
		getFirst: inst.getFirstWeekDayOfMonth(inst.year(), inst.month()),
		resolved: Intl.DateTimeFormat().resolvedOptions().timeZone,
	});
}
console.log(JSON.stringify({ tz: process.env.TZ, resolved: Intl.DateTimeFormat().resolvedOptions().timeZone, rows }));
`;
	const result = spawnSync(process.execPath, ["-e", script], {
		encoding: "utf8",
		env: { ...process.env, TZ: tz },
	});
	if (result.status !== 0) {
		throw new Error(tz + " probe failed:\n" + result.stdout + result.stderr);
	}
	return JSON.parse(result.stdout);
}

for (const tz of ZONES) {
	test("startOf/endOf week follow civil days in " + tz, () => {
		const probe = probeInZone(tz);
		assert.equal(probe.resolved, tz);
		assert.ok(probe.rows.length > 0);
		const failures = [];
		for (const row of probe.rows) {
			if (row.startCivil !== row.expectedStartCivil || row.endCivil !== row.expectedEndCivil) {
				failures.push(row);
			}
			assert.equal(row.getFirst, row.firstWeekDay);
		}
		assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
	});
}

test("America/New_York spring-forward Monday midnight does not jump to Friday", () => {
	const probe = probeInZone("America/New_York");
	const monday = probe.rows.find((row) => row.iso === "2026-03-09" && row.clock === "00:00:00");
	assert.ok(monday);
	assert.equal(monday.startCivil, monday.expectedStartCivil);
	assert.notEqual(monday.startCivil, "2026-03-06");
});
