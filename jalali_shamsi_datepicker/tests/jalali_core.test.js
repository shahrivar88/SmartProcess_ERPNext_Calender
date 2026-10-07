// Run: node --test jalali_shamsi_datepicker/tests/jalali_core.test.js jalali_shamsi_datepicker/tests/jalali_controls.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../public/js/jalali_core.js");

test("Gregorian -> Jalali display for known dates", () => {
	assert.equal(core.gregorianToJalaliString("2026-09-24"), "1405/07/02");
	assert.equal(core.gregorianToJalaliString("2026-10-07"), "1405/07/15");
	assert.equal(core.gregorianToJalaliString("2024-03-20"), "1403/01/01");
});

test("Jalali -> exact Gregorian value", () => {
	assert.equal(core.jalaliToGregorianString(1405, 7, 2), "2026-09-24");
	assert.equal(core.jalaliToGregorianString(1405, 7, 15), "2026-10-07");
});

test("Nowruz year boundary", () => {
	assert.equal(core.gregorianToJalaliString("2026-03-20"), "1404/12/29");
	assert.equal(core.gregorianToJalaliString("2026-03-21"), "1405/01/01");
	assert.equal(core.gregorianToJalaliString("2021-03-20"), "1399/12/30");
	assert.equal(core.gregorianToJalaliString("2021-03-21"), "1400/01/01");
});

test("Leap year Esfand", () => {
	assert.equal(core.isLeapJalaliYear(1399), true);
	assert.equal(core.isLeapJalaliYear(1403), true);
	assert.equal(core.isLeapJalaliYear(1404), false);
	assert.equal(core.jalaliMonthLength(1403, 12), 30);
	assert.equal(core.jalaliMonthLength(1404, 12), 29);
	assert.equal(core.jalaliToGregorianString(1403, 12, 30), "2025-03-20");
	assert.deepEqual(core.parseJalaliInput("1404/12/30"), { valid: false, input: "1404/12/30" });
});

test("Persian, Arabic and Latin digits are normalized", () => {
	const expected = { valid: true, gregorian: "2026-09-24", time: "" };
	assert.deepEqual(core.parseJalaliInput("۱۴۰۵/۰۷/۰۲"), expected);
	assert.deepEqual(core.parseJalaliInput("١٤٠٥/٠٧/٠٢"), expected);
	assert.deepEqual(core.parseJalaliInput("1405/7/2"), expected);
	assert.deepEqual(core.parseJalaliInput("1405-07-02"), expected);
});

test("Datetime input keeps the time portion untouched", () => {
	assert.deepEqual(core.parseJalaliInput("۱۴۰۵/۰۷/۰۲ ۱۴:۳۰:۰۵"), {
		valid: true,
		gregorian: "2026-09-24",
		time: "14:30:05",
	});
});

test("Impossible Jalali dates are rejected, not rolled over", () => {
	for (const bad of ["1405/13/01", "1405/00/10", "1405/07/31", "1405/01/32", "1405/07/00"]) {
		assert.equal(core.parseJalaliInput(bad).valid, false, bad);
	}
});

test("Non-Jalali input is left to Frappe", () => {
	for (const other of ["", "   ", null, undefined, "2026-09-24", "24-09-2026", "Today", "+1d", "abc"]) {
		assert.equal(core.parseJalaliInput(other), null, String(other));
	}
});

test("Compact YYYYMMDD Jalali input in Latin, Persian and Arabic digits", () => {
	const expected = { valid: true, gregorian: "2026-09-25", time: "" };
	assert.deepEqual(core.parseJalaliInput("14050703"), expected);
	assert.deepEqual(core.parseJalaliInput("۱۴۰۵۰۷۰۳"), expected);
	assert.deepEqual(core.parseJalaliInput("١٤٠٥٠٧٠٣"), expected);
	assert.deepEqual(core.parseJalaliInput("  14050703  "), expected);
	// Same day as the separated forms.
	for (const separated of ["1405/07/03", "1405-7-3", "۱۴۰۵/۰۷/۰۳"]) {
		assert.deepEqual(core.parseJalaliInput(separated), expected, separated);
	}
});

test("Compact Jalali datetime keeps the time portion untouched", () => {
	assert.deepEqual(core.parseJalaliInput("14050703 14:30:05"), {
		valid: true,
		gregorian: "2026-09-25",
		time: "14:30:05",
	});
	assert.deepEqual(core.parseJalaliInput("۱۴۰۵۰۷۰۳ ۱۴:۳۰"), {
		valid: true,
		gregorian: "2026-09-25",
		time: "14:30",
	});
});

test("Impossible compact Jalali dates are rejected, not rolled over", () => {
	for (const bad of ["14050731", "14051301", "14050001", "14050700", "14041230", "۱۴۰۵۰۷۳۱"]) {
		assert.deepEqual(core.parseJalaliInput(bad), { valid: false, input: core.normalizeDigits(bad) }, bad);
	}
	// Leap Esfand 30 is real.
	assert.deepEqual(core.parseJalaliInput("14031230"), { valid: true, gregorian: "2025-03-20", time: "" });
});

test("Compact digits that are not exactly 8 or not a Jalali year are left to Frappe", () => {
	for (const other of [
		"140573", // 6 digits: ambiguous, never guessed
		"1405073", // 7 digits
		"۱۴۰۵۰۷۳",
		"140507031", // 9 digits
		"20260925", // Gregorian YYYYMMDD
		"19990101",
		"11991231", // below the Jalali year range
		"16000101", // above the Jalali year range
		"25092026", // Gregorian DDMMYYYY outside the Jalali year range
		"1405 07 03",
		"1405070a",
	]) {
		assert.equal(core.parseJalaliInput(other), null, other);
	}
	assert.equal(core.normalizeGregorianInput("20260925"), null, "compact Gregorian stays with Frappe");
});

test("8 digits starting with a Jalali year are always Jalali; impossible ones are rejected", () => {
	// No tail-year guessing: with a dd-mm-yyyy site format, Frappe's non-strict moment parse
	// would silently store "14052001" (a mistyped Jalali month) as 2001-05-14.
	for (const bad of ["14052001", "14051901", "14052101", "12102026", "15062026", "12252026"]) {
		assert.deepEqual(core.parseJalaliInput(bad), { valid: false, input: bad }, bad);
	}
});

test("Compact round trip is exact for every day 1990-2040", () => {
	const day = new Date(Date.UTC(1990, 0, 1));
	const end = Date.UTC(2040, 11, 31);
	while (day.getTime() <= end) {
		const iso = day.toISOString().slice(0, 10);
		const compact = core.gregorianToJalaliString(iso).replace(/\//g, "");
		const parsed = core.parseJalaliInput(compact);
		assert.equal(parsed && parsed.valid, true, compact);
		assert.equal(parsed.gregorian, iso, compact);
		day.setUTCDate(day.getUTCDate() + 1);
	}
});

test("Invalid Gregorian input produces no Jalali text", () => {
	assert.equal(core.gregorianToJalaliString("2026-02-30"), "");
	assert.equal(core.gregorianToJalaliString("not a date"), "");
	assert.equal(core.gregorianToJalaliString(""), "");
});

test("escapeHtml neutralizes markup in user-supplied input", () => {
	assert.equal(
		core.escapeHtml("1405/04/31 <img src=x onerror=alert(1)>"),
		"1405/04/31 &lt;img src=x onerror=alert(1)&gt;"
	);
	assert.equal(core.escapeHtml('a"b\'c&d'), "a&quot;b&#39;c&amp;d");
	assert.equal(core.escapeHtml("plain 1405/04/31"), "plain 1405/04/31");
	assert.equal(core.escapeHtml(null), "");
	assert.equal(core.escapeHtml(undefined), "");
	assert.equal(core.escapeHtml(123), "123");
});

test("gregorianDateStringToTimestamp is local midnight and never rolls over", () => {
	const d = new Date(core.gregorianDateStringToTimestamp("2026-09-24"));
	assert.equal(d.getFullYear(), 2026);
	assert.equal(d.getMonth(), 8);
	assert.equal(d.getDate(), 24);
	assert.equal(d.getHours(), 0);
	for (const bad of ["2026-02-30", "2026-13-01", "2026-00-10", "not a date", "", null]) {
		assert.equal(core.gregorianDateStringToTimestamp(bad), null, String(bad));
	}
});

test("timestampToGregorianDateString uses the local calendar day", () => {
	assert.equal(core.timestampToGregorianDateString(new Date(2026, 8, 24, 23, 59, 59).getTime()), "2026-09-24");
	assert.equal(core.timestampToGregorianDateString(new Date(2026, 8, 25, 0, 0, 0).getTime()), "2026-09-25");
});

test("disabledDatesSet keeps only strict YYYY-MM-DD entries", () => {
	const set = core.disabledDatesSet(["2026-09-25", "garbage", "2026-9-5", null, "2026-09-30"]);
	assert.ok(set instanceof Set);
	assert.deepEqual([...set].sort(), ["2026-09-25", "2026-09-30"]);
	assert.equal(core.disabledDatesSet([]), null);
	assert.equal(core.disabledDatesSet(["bad"]), null);
	assert.equal(core.disabledDatesSet(null), null);
	assert.equal(core.disabledDatesSet("2026-09-25"), null);
});

test("normalizeGregorianInput normalizes ISO-ish Gregorian with any digit system", () => {
	assert.equal(core.normalizeGregorianInput("2026/09/24"), "2026-09-24");
	assert.equal(core.normalizeGregorianInput("۲۰۲۶/۰۹/۲۴"), "2026-09-24");
	assert.equal(core.normalizeGregorianInput("2026-9-4"), "2026-09-04");
	assert.equal(core.normalizeGregorianInput("2026.9.4"), "2026-09-04");
	assert.equal(core.normalizeGregorianInput("2026-09-24 14:30:05"), "2026-09-24 14:30:05");
	// Jalali years stay owned by parseJalaliInput, not normalised as Gregorian.
	assert.equal(core.normalizeGregorianInput("١٤٠٥/٠٧/٠٢"), null);
	for (const bad of ["2026-02-30", "2026-13-01", "1899-12-31", "2101-01-01", "not a date", "", null, undefined]) {
		assert.equal(core.normalizeGregorianInput(bad), null, String(bad));
	}
});

test("Round trip is exact for every day 1990-2040", () => {
	const day = new Date(Date.UTC(1990, 0, 1));
	const end = Date.UTC(2040, 11, 31);
	let previous = "";
	while (day.getTime() <= end) {
		const iso = day.toISOString().slice(0, 10);
		const jalali = core.gregorianToJalaliString(iso);
		const parsed = core.parseJalaliInput(jalali);
		assert.equal(parsed.valid, true, iso);
		assert.equal(parsed.gregorian, iso);
		assert.ok(jalali > previous, "Jalali dates must increase: " + iso);
		previous = jalali;
		day.setUTCDate(day.getUTCDate() + 1);
	}
});
