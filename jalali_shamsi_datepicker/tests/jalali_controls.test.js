// Run: node --test jalali_shamsi_datepicker/tests/jalali_controls.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const jsDir = path.join(__dirname, "..", "public", "js");
const coreSrc = fs.readFileSync(path.join(jsDir, "jalali_core.js"), "utf8");
const controlsSrc = fs.readFileSync(path.join(jsDir, "jalali_controls.js"), "utf8");

function makeContext(enabled) {
	class ControlDate {
		format_for_input(value) {
			return value || "";
		}
		parse(value) {
			return value;
		}
		set_formatted_input(value) {
			this.last_formatted = value;
			return this;
		}
	}
	class ControlDatetime extends ControlDate {}
	class ControlTime extends ControlDate {}
	const formatDate = (value) => value || "";
	const formatDatetime = (value) => value || "";
	const formatTime = (value) => value || "";
	const frappe = {
		boot: { jalali_calendar_enabled: enabled },
		_msgprint_history: [],
		ui: { form: { ControlDate, ControlDatetime, ControlTime } },
		form: { formatters: { Date: formatDate, Datetime: formatDatetime, Time: formatTime } },
		datetime: {
			user_to_str: (v) => v,
			str_to_user: (v) => v,
			convert_to_system_tz: (v) => v,
			now_datetime: () => "2026-09-24 10:30:00",
			now_time: () => "10:30:00",
		},
		msgprint(opts) {
			frappe._msgprint_history.push(opts);
		},
	};
	const $ = () => ({ addClass() {}, val() { return ""; }, trigger() { return this; } });
	const ctx = vm.createContext({
		frappe,
		$,
		// Frappe's __() interpolates {0} with the first argument.
		__: (s, args) => (Array.isArray(args) && args.length ? s.replace("{0}", args[0]) : s),
		// vm contexts have no timers: run 0ms callbacks synchronously so restores happen inline.
		setTimeout: (fn) => {
			fn();
			return 1;
		},
	});
	ctx.window = ctx;
	vm.runInContext(coreSrc, ctx);
	return { ctx, frappe, originals: { ControlDate, ControlDatetime, ControlTime, formatDate, formatDatetime, formatTime } };
}

function patchedFrappe(enabled) {
	const env = makeContext(enabled);
	vm.runInContext(controlsSrc, env.ctx);
	return env;
}

function makeInputStub() {
	return {
		_v: "",
		val(v) {
			if (arguments.length) {
				this._v = v;
				return this;
			}
			return this._v;
		},
		trigger() {
			return this;
		},
		on() {
			return this;
		},
		off() {
			return this;
		},
	};
}

function makeInstance(mode, opts = {}) {
	const env = patchedFrappe(true);
	const name = mode === "datetime" ? "Datetime" : mode === "time" ? "Time" : "Date";
	const inst = new env.frappe.ui.form["Control" + name]();
	inst.df = opts.df || {};
	inst.get_model_value = () => (opts.model !== undefined ? opts.model : "");
	inst.$input = opts.$input || makeInputStub();
	return { env, inst };
}

test("disabled setting leaves standard controls and formatters untouched", () => {
	const { ctx, frappe, originals } = makeContext(false);
	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, originals.ControlDate);
	assert.equal(frappe.ui.form.ControlDatetime, originals.ControlDatetime);
	assert.equal(frappe.ui.form.ControlTime, originals.ControlTime);
	assert.equal(frappe.form.formatters.Date, originals.formatDate);
	assert.equal(frappe.form.formatters.Datetime, originals.formatDatetime);
	assert.equal(frappe.form.formatters.Time, originals.formatTime);
	assert.equal(frappe.form.formatters.Date("2026-09-24"), "2026-09-24");
});

test("enabled setting patches once and formats Jalali without changing the value", () => {
	const { ctx, frappe, originals } = makeContext(true);
	vm.runInContext(controlsSrc, ctx);
	const patchedDate = frappe.ui.form.ControlDate;
	assert.notEqual(patchedDate, originals.ControlDate);
	assert.ok(new patchedDate() instanceof originals.ControlDate);
	assert.equal(frappe.form.formatters.Date("2026-09-24"), "1405/07/02");
	assert.equal(frappe.form.formatters.Datetime("2026-09-24 14:30:05"), "1405/07/02 14:30:05");

	vm.runInContext(controlsSrc, ctx);
	assert.equal(frappe.ui.form.ControlDate, patchedDate, "second load must not wrap again");
});

test("parse converts valid Jalali input into the Gregorian model value", () => {
	const { inst } = makeInstance("date");
	assert.equal(inst.parse("1405/07/02"), "2026-09-24");
	assert.equal(inst.parse("۱۴۰۵/۰۷/۰۲"), "2026-09-24"); // Persian digits normalize too.

	const { inst: datetime } = makeInstance("datetime");
	assert.equal(datetime.parse("1405/07/02 14:30:05"), "2026-09-24 14:30:05");
	assert.equal(datetime.parse("۱۴۰۵/۰۷/۰۲ ۱۴:۳۰:۰۵"), "2026-09-24 14:30:05");
});

test("parse rejects impossible Jalali dates, restores the field and reports", () => {
	const { env, inst } = makeInstance("date", { model: "2026-09-24" });

	const result = inst.parse("1404/12/30"); // Esfand 30 in a common Jalali year
	assert.equal(result, "2026-09-24", "must return the previous value, not a rolled-over date");
	assert.equal(inst.last_formatted, "2026-09-24", "input text restored from the model");
	assert.equal(env.frappe._msgprint_history.length, 1);
	assert.equal(env.frappe._msgprint_history[0].indicator, "red");
	assert.ok(env.frappe._msgprint_history[0].message.includes("1404/12/30"));
});

test("parse escapes user markup before msgprint renders it as HTML", () => {
	const { env, inst } = makeInstance("date", { model: "2026-09-24" });

	const evil = "1404/12/30 <img src=x onerror=alert(1)>";
	inst.parse(evil);

	const message = env.frappe._msgprint_history[0].message;
	assert.ok(message.includes("&lt;img"), "markup must be escaped in the message: " + message);
	assert.ok(!message.includes("<img"), "raw markup must never reach msgprint: " + message);
	assert.ok(!message.includes("onerror=\""), "attribute must not survive as HTML: " + message);
});

test("parse keeps Gregorian ISO input working (any digit system)", () => {
	const { inst } = makeInstance("date");
	assert.equal(inst.parse("2026/09/24"), "2026-09-24");
	assert.equal(inst.parse("۲۰۲۶/۰۹/۲۴"), "2026-09-24");
	// Non-date expressions still go to Frappe's own parse unchanged.
	assert.equal(inst.parse("Today"), "Today");
	assert.equal(inst.parse(""), "");
});

test("parse converts compact Jalali input (any digit system) into the Gregorian model value", () => {
	const { env, inst } = makeInstance("date");
	for (const typed of ["14050703", "۱۴۰۵۰۷۰۳", "١٤٠٥٠٧٠٣"]) {
		assert.equal(inst.parse(typed), "2026-09-25", typed);
	}
	assert.equal(env.frappe._msgprint_history.length, 0);

	const { inst: datetime } = makeInstance("datetime");
	assert.equal(datetime.parse("14050703 14:30:05"), "2026-09-25 14:30:05");
	assert.equal(datetime.parse("۱۴۰۵۰۷۰۳ ۱۴:۳۰:۰۵"), "2026-09-25 14:30:05");
});

test("parse rejects impossible compact Jalali dates like separated ones", () => {
	for (const bad of ["14050731", "14051301", "14050001"]) {
		const { env, inst } = makeInstance("date", { model: "2026-09-24" });
		assert.equal(inst.parse(bad), "2026-09-24", bad);
		assert.equal(inst.last_formatted, "2026-09-24", bad);
		assert.equal(env.frappe._msgprint_history.length, 1, bad);
		assert.ok(env.frappe._msgprint_history[0].message.includes(bad), bad);
	}
});

test("parse hands Gregorian-looking digits and expressions to Frappe unchanged", () => {
	const { env, inst } = makeInstance("date");
	for (const other of ["20260925", "25092026", "12102026", "140573", "1405073", "Today", "+1d", "-2w"]) {
		assert.equal(inst.parse(other), other, other);
	}
	assert.equal(env.frappe._msgprint_history.length, 0);
});

test("no Jalali text ever reaches the model value", () => {
	const { inst } = makeInstance("date");
	const { inst: datetime } = makeInstance("datetime");
	const inputs = ["14050703", "۱۴۰۵۰۷۰۳", "1405/07/03", "1405-7-3", "۱۴۰۵/۰۷/۰۳", "2026-09-25", "2026/09/25"];
	for (const typed of inputs) {
		assert.equal(inst.parse(typed), "2026-09-25", typed);
		assert.equal(datetime.parse(typed + " 08:15:00"), "2026-09-25 08:15:00", typed);
	}
});

test("build_jalali_date_options derives min/max timestamps from Gregorian df values", () => {
	const { inst } = makeInstance("date");
	inst.df = { min_date: "2026-09-24", max_date: "2026-10-07" };
	const opts = inst.build_jalali_date_options();
	assert.equal(opts.minDate, new Date(2026, 8, 24).getTime());
	assert.equal(opts.maxDate, new Date(2026, 9, 7).getTime());
	assert.equal(typeof opts.checkDate, "undefined");

	inst.df = { min_date: "2026-02-30" }; // not a real day -> ignored, no roll-over
	const opts2 = inst.build_jalali_date_options();
	assert.equal(opts2.minDate, undefined);

	inst.df = {};
	const empty = inst.build_jalali_date_options();
	assert.equal(Object.keys(empty).length, 0, "empty df must produce no options");
});

test("build_jalali_date_options turns disabled_dates into a local-day checkDate", () => {
	const { inst } = makeInstance("date");
	inst.df = { disabled_dates: ["2026-09-25", "garbage", "2026-09-30"] };
	const opts = inst.build_jalali_date_options();
	assert.equal(typeof opts.checkDate, "function");
	assert.equal(opts.checkDate(new Date(2026, 8, 25).getTime()), false);
	assert.equal(opts.checkDate(new Date(2026, 8, 30).getTime()), false);
	assert.equal(opts.checkDate(new Date(2026, 8, 26).getTime()), true);
});

test("select_jalali_today converts to system tz exactly once and shows Jalali", () => {
	const { env, inst } = makeInstance("date");
	const tzCalls = [];
	env.frappe.datetime.convert_to_system_tz = (v) => {
		tzCalls.push(v);
		return "2026-09-24 06:00:00";
	};
	inst.$input = makeInputStub();
	const picker = { hidden: false, hide() { this.hidden = true; } };

	inst.select_jalali_today(picker);

	assert.deepEqual(tzCalls, ["2026-09-24 10:30:00"], "now_datetime must be converted exactly once");
	assert.equal(inst.$input._v, "1405/07/02", "input shows the Jalali date");
	assert.equal(picker.hidden, true);
});

test("select_jalali_today keeps the datetime time part from the system-zone value", () => {
	const { env, inst } = makeInstance("datetime");
	env.frappe.datetime.convert_to_system_tz = () => "2026-09-24 06:00:00";
	inst.$input = makeInputStub();
	const picker = { hidden: false, hide() { this.hidden = true; } };

	inst.select_jalali_today(picker);

	assert.equal(inst.$input._v, "1405/07/02 06:00:00");
	assert.equal(picker.hidden, true);
});

test("select_jalali_today (time mode) uses now_time without any tz juggling", () => {
	const { env, inst } = makeInstance("time");
	env.frappe.datetime.now_time = () => "10:30:00";
	inst.$input = makeInputStub();
	const picker = { hidden: false, hide() { this.hidden = true; } };

	inst.select_jalali_today(picker);

	assert.equal(inst.$input._v, "10:30:00");
	assert.equal(picker.hidden, true);
});