// RAW vendor (persian-date, no adapter) vs core (jalaali-js). Production loads
// jalali_persian_date_adapter.js so the picker never sees this disagreement;
// this file keeps the unpatched 1830-day / 5-Esfand-30 fingerprint so a vendor
// upgrade cannot silently change the leap table. Do not install the adapter here.
//
// NOTE: persian-date's astronomical conversion is expensive (~1ms/date), so this
// file makes ONE full pass (~90s) and asserts everything from it.
// Run: node --test jalali_shamsi_datepicker/tests/jalali_leap.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../public/js/jalali_core.js");
const PersianDate = require("../public/js/persian-date.min.js");
assert.equal(
	PersianDate.__jalaliCoreAdapter,
	undefined,
	"this file must see the raw vendor; do not load jalali_persian_date_adapter.js here"
);

function pad(n) {
	return String(n).padStart(2, "0");
}

const START = new Date(1830, 0, 1);
const END = new Date(2096, 11, 31);

test("core round-trips every day; vendor/core diverge only on known leap pairs", () => {
	const invalid = new Set();
	let differing = 0;
	const d = new Date(START);
	while (d.getTime() <= END.getTime()) {
		const iso = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

		const coreText = core.gregorianToJalaliString(iso);
		// Core output must always be a valid Jalali date that round-trips.
		const back = core.parseJalaliInput(coreText);
		assert.equal(back.valid, true, iso);
		assert.equal(back.gregorian, iso);

		const vendor = new PersianDate(new Date(d)).toArray();
		const vendorText = vendor[0] + "/" + pad(vendor[1]) + "/" + pad(vendor[2]);
		if (coreText !== vendorText) {
			differing += 1;
			// Vendor's renderings that the core rejects are the dangerous set.
			const parsed = core.parseJalaliInput(vendorText);
			if (!parsed || !parsed.valid) invalid.add(vendorText);
		}
		d.setDate(d.getDate() + 1);
	}

	assert.deepEqual(
		[...invalid].sort(),
		["1209/12/30", "1275/12/30", "1308/12/30", "1341/12/30", "1473/12/30"]
	);
	// 1830 days across the 5 divergent year-pairs (each shift covers the rest of
	// that vendor year: 365/366 days).
	assert.equal(differing, 1830);
});

test("structural anchors: vendor renders Esfand 30 where core starts the new year", () => {
	const anchors = {
		"1831-03-21": { core: "1210/01/01", vendor: "1209/12/30" },
		"1897-03-20": { core: "1276/01/01", vendor: "1275/12/30" },
		"1930-03-21": { core: "1309/01/01", vendor: "1308/12/30" },
		"1963-03-21": { core: "1342/01/01", vendor: "1341/12/30" },
		"2095-03-20": { core: "1474/01/01", vendor: "1473/12/30" },
	};
	for (const [iso, expected] of Object.entries(anchors)) {
		assert.equal(core.gregorianToJalaliString(iso), expected.core, iso);
		const vendor = new PersianDate(new Date(iso + "T00:00:00")).toArray();
		const vendorText = vendor[0] + "/" + pad(vendor[1]) + "/" + pad(vendor[2]);
		assert.equal(vendorText, expected.vendor, iso);
	}
});