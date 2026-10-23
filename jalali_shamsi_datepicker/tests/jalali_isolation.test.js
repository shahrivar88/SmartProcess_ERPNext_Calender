// Isolation and fail-safe init. These tests use mocked Frappe (vm), not a real site.
// Run: node --test jalali_shamsi_datepicker/tests/jalali_isolation.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const jsDir = path.join(__dirname, "..", "public", "js");
const core = require(path.join(jsDir, "jalali_core.js"));
const PersianDate = require(path.join(jsDir, "persian-date.min.js"));
const adapter = require(path.join(jsDir, "jalali_persian_date_adapter.js"));
const coreSrc = fs.readFileSync(path.join(jsDir, "jalali_core.js"), "utf8");
const adapterSrc = fs.readFileSync(path.join(jsDir, "jalali_persian_date_adapter.js"), "utf8");
const controlsSrc = fs.readFileSync(path.join(jsDir, "jalali_controls.js"), "utf8");

function pad(n) {
	return String(n).padStart(2, "0");
}

function jalaliText(parts) {
	return parts[0] + "/" + pad(parts[1]) + "/" + pad(parts[2]);
}

function mockedFrappe(opts = {}) {
	class ControlDate {
		format_for_input(value) {
			return value || "";
		}
		parse(value) {
			return value;
		}
	}
	if (opts.dropParse) delete ControlDate.prototype.parse;
	class ControlDatetime extends ControlDate {}
	class ControlTime extends ControlDate {}
	const frappe = {
		boot: { jalali_calendar_enabled: opts.enabled !== false },
		ui: { form: { ControlDate, ControlDatetime, ControlTime } },
		form: { formatters: { Date: (v) => v || "", Datetime: (v) => v || "" } },
		datetime: {
			user_to_str: (v) => v,
			str_to_user: (v) => v,
			convert_to_system_tz: (v) => v,
			now_datetime: () => "2026-09-24 10:30:00",
			now_time: () => "10:30:00",
		},
		msgprint() {},
	};
	const ctx = vm.createContext({
		frappe,
		$: () => ({ addClass() {} }),
		__: (s) => s,
		setTimeout: (fn) => fn(),
		window: {},
	});
	ctx.window = ctx;
	if (opts.loadCore !== false) vm.runInContext(coreSrc, ctx);
	if (opts.loadAdapter) vm.runInContext(adapterSrc, ctx);
	if (opts.persianDate) ctx.persianDate = opts.persianDate;
	return { ctx, frappe, ControlDate };
}

test("inspect rejects a missing or incomplete vendor without mutating it", () => {
	assert.equal(adapter.inspect(null).ok, false);
	assert.equal(adapter.createIsolatedConstructor(null, core).ok, false);
	function Fake() {}
	Fake.prototype = { format() {} };
	const before = Object.getOwnPropertyNames(Fake.prototype).slice();
	const created = adapter.createIsolatedConstructor(Fake, core);
	assert.equal(created.ok, false);
	assert.equal(created.reason, "unsupported vendor signature");
	assert.deepEqual(Object.getOwnPropertyNames(Fake.prototype), before);
	assert.equal(Fake.__jalaliCoreAdapter, undefined);
});

test("createIsolatedConstructor never patches the global vendor prototype", () => {
	const protoSnapshot = PersianDate.prototype._gDateToCalculators;
	const first = adapter.createIsolatedConstructor(PersianDate, core);
	const second = adapter.createIsolatedConstructor(PersianDate, core);
	assert.equal(first.ok && second.ok, true);
	assert.equal(PersianDate.prototype._gDateToCalculators, protoSnapshot);
	assert.equal(PersianDate.__jalaliCoreAdapter, undefined);
	assert.equal(jalaliText(new PersianDate(new Date(1831, 2, 21, 12)).toArray()), "1209/12/30");
	assert.equal(jalaliText(new first.constructor(new Date(1831, 2, 21, 12)).toArray()), "1210/01/01");
});

test("unsupported Jalali years do not fall back to the vendor leap table", () => {
	const Isolated = adapter.createIsolatedConstructor(PersianDate, core).constructor;
	const sample = new Isolated([1400, 1, 1]);
	assert.doesNotThrow(() => sample.isLeapYear(4000));
	assert.equal(sample.isLeapYear(4000), false);
	assert.equal(sample.isLeapYear(1209), false);
	assert.equal(new PersianDate([1400, 1, 1]).isLeapYear(1209), true);
});

test("mocked Frappe: disabled Jalali leaves standard controls and the vendor untouched", () => {
	const { ctx, frappe, ControlDate } = mockedFrappe({ enabled: false, loadAdapter: true });
	ctx.persianDate = PersianDate;
	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, ControlDate);
	assert.equal(frappe.form.formatters.Date("2026-09-24"), "2026-09-24");
	assert.equal(PersianDate.__jalaliCoreAdapter, undefined);
	assert.equal(jalaliText(new PersianDate(new Date(1831, 2, 21, 12)).toArray()), "1209/12/30");
});

test("mocked Frappe: missing core does not wrap controls", () => {
	const { ctx, frappe, ControlDate } = mockedFrappe({ loadCore: false });
	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, ControlDate);
	assert.equal(frappe.form.formatters.Date("2026-09-24"), "2026-09-24");
});

test("mocked Frappe: incompatible ControlDate.parse is left alone", () => {
	const { ctx, frappe, ControlDate } = mockedFrappe({ dropParse: true });
	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, ControlDate);
	assert.equal(frappe.form.formatters.Date("2026-09-24"), "2026-09-24");
});

test("mocked Frappe: a second install does not double-wrap", () => {
	const { ctx, frappe } = mockedFrappe();
	vm.runInContext(controlsSrc, ctx);
	const wrapped = frappe.ui.form.ControlDate;
	assert.equal(wrapped.__jalaliShamsiWrapped, true);
	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, wrapped);
});

test("mocked Frappe: a throw during wrap restores Control constructors", () => {
	const { ctx, frappe, ControlDate } = mockedFrappe();
	const original = frappe.form.formatters.Date;
	Object.defineProperty(frappe.form.formatters, "Date", {
		configurable: true,
		get() {
			return original;
		},
		set() {
			throw new Error("formatter locked");
		},
	});
	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, ControlDate);
	assert.equal(frappe.ui.form.ControlDate.__jalaliShamsiWrapped, undefined);
	assert.equal(ctx.jalali_shamsi_datepicker.controls_installed, false);
});

test("isolated startOf('day') stays on the core Gregorian day of a leap pair", () => {
	const Isolated = adapter.createIsolatedConstructor(PersianDate, core).constructor;
	const min = new Date(1831, 2, 21, 0, 0, 0, 0).getTime();
	const start = new Isolated(min).startOf("day").valueOf();
	const local = new Date(start);
	assert.equal(local.getFullYear(), 1831);
	assert.equal(local.getMonth(), 2);
	assert.equal(local.getDate(), 21);
	const vendorFromJalali = new Date(new PersianDate([1210, 1, 1, 0, 0, 0]).valueOf());
	assert.equal(vendorFromJalali.getDate(), 22);
});

test("attachToPicker is a no-op without a picker factory and does not patch the vendor", () => {
	const Isolated = adapter.createIsolatedConstructor(PersianDate, core).constructor;
	assert.equal(adapter.attachToPicker(null, Isolated).ok, false);
	assert.equal(adapter.attachToPicker({ model: {} }, Isolated).ok, false);
	const factory = {
		date(input) {
			return new PersianDate(input);
		},
	};
	const picker = { model: { PersianDate: factory, options: { locale_: "fa" } } };
	assert.equal(adapter.attachToPicker(picker, Isolated).ok, true);
	assert.equal(factory.__jalaliIsolated, true);
	assert.equal(jalaliText(factory.date(new Date(1831, 2, 21, 12)).toArray()), "1210/01/01");
	assert.equal(jalaliText(new PersianDate(new Date(1831, 2, 21, 12)).toArray()), "1209/12/30");
	assert.deepEqual(adapter.attachToPicker(picker, Isolated), { ok: true, skipped: true });
});
