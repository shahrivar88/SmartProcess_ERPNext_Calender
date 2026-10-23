// Picker-level proof that display, selection and stored Gregorian share jalali_core.
const { test, expect } = require("@playwright/test");
const path = require("node:path");
const root = path.resolve(__dirname, "../../..");

const LEAP_CASES = [
	{ iso: "1831-03-21", jalali: "1210/01/01", cell: "1210,1,1" },
	{ iso: "1897-03-20", jalali: "1276/01/01", cell: "1276,1,1" },
	{ iso: "1930-03-21", jalali: "1309/01/01", cell: "1309,1,1" },
	{ iso: "1963-03-21", jalali: "1342/01/01", cell: "1342,1,1" },
	{ iso: "2095-03-20", jalali: "1474/01/01", cell: "1474,1,1" },
];

test.beforeEach(async ({ page }) => {
	await page.setContent(
		'<html><body class="jalali-calendar-enabled"><div id="host" style="position:absolute;left:330px;top:100px"><input style="width:320px;height:30px"></div></body></html>'
	);
	await page.addScriptTag({ path: require.resolve("jquery") });
	await page.evaluate(() => {
		class ControlDate {
			format_for_input(value) {
				return value || "";
			}
			parse(value) {
				return value;
			}
			set_date_options() {}
			set_t_for_today() {}
			set_time_options() {}
			set_disp_area() {}
		}
		window.__ = (s) => s;
		window.frappe = {
			boot: { jalali_calendar_enabled: true },
			ui: { form: { ControlDate, ControlDatetime: class extends ControlDate {}, ControlTime: class extends ControlDate {} } },
			form: { formatters: { Date: (v) => v, Datetime: (v) => v } },
			datetime: { user_to_str: (v) => v, str_to_user: (v) => v, now_time: () => "10:30:00" },
			router: { jq: $({}), on(event, fn) { this.jq.on(event, (e, data) => fn(data)); } },
			msgprint() {},
		};
	});
	for (const file of [
		"persian-date.min.js",
		"persian-datepicker.min.js",
		"jalali_core.js",
		"jalali_persian_date_adapter.js",
		"jalali_controls.js",
	]) {
		await page.addScriptTag({ path: path.join(root, "jalali_shamsi_datepicker/public/js", file) });
	}
	for (const file of ["persian-datepicker.min.css", "custom.css"]) {
		await page.addStyleTag({ path: path.join(root, "jalali_shamsi_datepicker/public/css", file) });
	}
	await page.evaluate(() => {
		window.openControl = (type = "Date", model = "2026-09-24", df = {}) => {
			window.control = new frappe.ui.form["Control" + type]();
			control.df = { fieldname: "date", ...df };
			control.$input = $("input").first();
			let current = model;
			control.get_model_value = () => current;
			control.$input.off("change.model").on("change.model", () => {
				current = control.parse(control.$input.val());
			});
			control.$input.val(control.format_for_input(model));
			control.make_picker();
			control.show_jalali_picker();
		};
		window.geometry = () => {
			const box = control.$jalali_container[0].getBoundingClientRect();
			const input = control.$input[0].getBoundingClientRect();
			return {
				left: box.left,
				expected: Math.max(8, Math.min(input.left + (input.width - box.width) / 2, innerWidth - box.width - 8)),
			};
		};
	});
});

test("global vendor stays unpatched while this app's picker uses the isolated engine", async ({ page }) => {
	const isolation = await page.evaluate(() => {
		const raw = new persianDate(new Date(1831, 2, 21, 12, 0, 0)).toArray();
		openControl("Date", "1831-03-21");
		return {
			globalFlag: !!persianDate.__jalaliCoreAdapter,
			raw: raw[0] + "/" + raw[1] + "/" + raw[2],
			pickerIsolated: !!(control.jalali_picker && control.jalali_picker.model.PersianDate.__jalaliIsolated),
			selected: control.$jalali_container.find("td.selected").attr("data-date"),
		};
	});
	expect(isolation.globalFlag).toBe(false);
	expect(isolation.raw).toBe("1209/12/30");
	expect(isolation.pickerIsolated).toBe(true);
	expect(isolation.selected).toBe("1210,1,1");
});

test("a foreign persianDatepicker consumer still sees the unmodified vendor", async ({ page }) => {
	const foreign = await page.evaluate(() => {
		const $input = $('<input id="foreign">').appendTo("body");
		const picker = $input.persianDatepicker({
			initialValue: false,
			persianDigit: false,
			calendar: { persian: { locale: "fa", leapYearMode: "astronomical" } },
		});
		picker.setDate(new Date(1831, 2, 21, 12, 0, 0).getTime());
		const selected = picker.model.view.$container.find("td.selected").attr("data-date");
		picker.destroy();
		$input.remove();
		return {
			selected,
			globalFlag: !!persianDate.__jalaliCoreAdapter,
		};
	});
	expect(foreign.globalFlag).toBe(false);
	expect(foreign.selected).toBe("1209,12,30");
});

test("adapter is installed and empty-field cells still match core timestamps", async ({ page }) => {
	expect(await page.evaluate(() => !!persianDate.__jalaliCoreAdapter)).toBe(false);
	const days = await page.evaluate(() => {
		openControl("Date", "");
		const core = jalali_shamsi_datepicker.core;
		return control.$jalali_container.find(".table-days td").toArray().map((el) => {
			const parts = String(el.dataset.date || "").split(",");
			const parsed = parts.length === 3 ? core.parseJalaliInput(parts.join("/")) : null;
			return {
				label: el.dataset.date,
				actual: core.timestampToGregorianDateString(Number(el.dataset.unix)),
				expected: parsed && parsed.valid ? parsed.gregorian : null,
			};
		});
	});
	expect(days.length).toBeGreaterThan(27);
	for (const day of days) {
		expect(day.expected, day.label).toBeTruthy();
		expect(day.actual, day.label).toBe(day.expected);
	}
});

for (const item of LEAP_CASES) {
	test(`Date selection of ${item.jalali} stores ${item.iso}, not the vendor Esfand 30`, async ({ page }) => {
		const result = await page.evaluate((item) => {
			openControl("Date", item.iso);
			const selected = control.$jalali_container.find("td.selected").attr("data-date");
			const year = Number(String(item.cell).split(",")[0]);
			const ghost = control.$jalali_container.find('td[data-date="' + (year - 1) + ',12,30"]').length;
			control.$jalali_container.find('td[data-date="' + item.cell + '"]').trigger("click");
			return {
				selected,
				input: control.$input.val(),
				model: control.get_model_value(),
				ghost,
			};
		}, item);
		expect(result.selected).toBe(item.cell);
		expect(result.input).toBe(item.jalali);
		expect(result.model).toBe(item.iso);
		expect(result.ghost).toBe(0);
	});

	test(`Datetime ${item.jalali} keeps 14:30:05 on ${item.iso}`, async ({ page }) => {
		const result = await page.evaluate((item) => {
			openControl("Datetime", item.iso + " 14:30:05");
			return {
				selected: control.$jalali_container.find("td.selected").attr("data-date"),
				input: control.$input.val(),
				model: control.get_model_value(),
				time: ["hour", "minute", "second"].map((key) =>
					control.$jalali_container.find("." + key + "-input").val()
				),
			};
		}, item);
		expect(result.selected).toBe(item.cell);
		expect(result.input).toBe(item.jalali + " 14:30:05");
		expect(result.model).toBe(item.iso + " 14:30:05");
		expect(result.time).toEqual(["14", "30", "05"]);
	});
}

test("Esfand 1209 has 29 days and 1210/12/30 is selectable", async ({ page }) => {
	const grid = await page.evaluate(() => {
		const currentMonth = () =>
			control.$jalali_container
				.find(".table-days td")
				.toArray()
				.filter((el) => !el.querySelector("span.other-month"))
				.map((el) => el.dataset.date);
		openControl("Date", "1831-03-20");
		const esfand = currentMonth();
		control.jalali_picker.hide();
		openControl("Date", "1832-03-20");
		const leapEsfand = currentMonth();
		control.$jalali_container.find('td[data-date="1210,12,30"]').trigger("click");
		return {
			esfand,
			leapEsfand,
			model: control.get_model_value(),
			input: control.$input.val(),
		};
	});
	expect(grid.esfand).toHaveLength(29);
	expect(grid.esfand).not.toContain("1209,12,30");
	expect(grid.leapEsfand).toHaveLength(30);
	expect(grid.leapEsfand).toContain("1210,12,30");
	expect(grid.input).toBe("1210/12/30");
	expect(grid.model).toBe("1832-03-20");
});

test("min/max and disabled_dates follow the core Gregorian day on a leap pair", async ({ page }) => {
	await page.evaluate(() => {
		openControl("Date", "1831-03-21", {
			min_date: "1831-03-21",
			max_date: "1831-03-25",
			disabled_dates: ["1831-03-22"],
		});
	});
	expect(await page.locator('.jalali-picker td[data-date="1210,1,1"]').last().getAttribute("class")).not.toContain("disabled");
	expect(await page.locator('.jalali-picker td[data-date="1210,1,2"]').last().getAttribute("class")).toContain("disabled");
	await page.locator('.jalali-picker td[data-date="1210,1,3"]').last().click();
	expect(await page.locator("input").first().inputValue()).toBe("1210/01/03");
	expect(await page.evaluate(() => control.get_model_value())).toBe("1831-03-23");
});

test("DST boundary civil days keep the selected clock", async ({ page }, testInfo) => {
	const cases = [
		{ iso: "2026-03-08", time: "01:30:00" },
		{ iso: "2026-03-08", time: "03:30:00" },
		{ iso: "2026-11-01", time: "01:30:00" },
		{ iso: "2026-11-01", time: "02:30:00" },
	];
	for (const item of cases) {
		const result = await page.evaluate((item) => {
			const core = jalali_shamsi_datepicker.core;
			const jalali = core.gregorianToJalaliString(item.iso);
			openControl("Datetime", item.iso + " " + item.time);
			const [y, m, d] = jalali.split("/");
			return {
				tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
				jalali,
				selected: control.$jalali_container.find("td.selected").attr("data-date"),
				input: control.$input.val(),
				model: control.get_model_value(),
				expectedCell: [Number(y), Number(m), Number(d)].join(","),
			};
		}, item);
		expect(result.tz).toBe(testInfo.project.use.timezoneId);
		expect(result.selected).toBe(result.expectedCell);
		expect(result.input).toBe(result.jalali + " " + item.time);
		expect(result.model).toBe(item.iso + " " + item.time);
	}
});

test("RTL popup still centers on a leap-pair Date field", async ({ page }) => {
	const box = await page.evaluate(() => {
		document.documentElement.dir = "rtl";
		openControl("Date", "1831-03-21");
		return geometry();
	});
	expect(Math.abs(box.left - box.expected)).toBeLessThanOrEqual(0.5);
});

test("persian-datepicker constructs with the vendor before attachToPicker, then re-renders isolated", async ({ page }) => {
	const result = await page.evaluate(() => {
		const adapter = jalali_shamsi_datepicker.persianDateAdapter;
		const orig = adapter.attachToPicker;
		let before = null;
		adapter.attachToPicker = function (picker, isolated) {
			const factory = picker.model.PersianDate;
			const raw = factory.date(new Date(1831, 2, 21, 12, 0, 0)).toArray();
			before = {
				isolated: !!factory.__jalaliIsolated,
				label: raw[0] + "," + raw[1] + "," + raw[2],
			};
			return orig.call(this, picker, isolated);
		};
		openControl("Date", "1831-03-21");
		adapter.attachToPicker = orig;
		const month = control.$jalali_container
			.find(".table-days td")
			.toArray()
			.filter((el) => !el.querySelector("span.other-month"))
			.map((el) => el.dataset.date);
		return {
			before,
			afterIsolated: !!control.jalali_picker.model.PersianDate.__jalaliIsolated,
			after: control.$jalali_container.find("td.selected").attr("data-date"),
			model: control.get_model_value(),
			input: control.$input.val(),
			month,
		};
	});
	expect(result.before.isolated).toBe(false);
	expect(result.before.label).toBe("1209,12,30");
	expect(result.afterIsolated).toBe(true);
	expect(result.after).toBe("1210,1,1");
	expect(result.model).toBe("1831-03-21");
	expect(result.input).toBe("1210/01/01");
	expect(result.month[0]).toBe("1210,1,1");
	expect(result.month).not.toContain("1209,12,30");
});

test("open/close cycles disconnect observers and document handlers", async ({ page }) => {
	const result = await page.evaluate(async () => {
		let liveObservers = 0;
		const Native = window.MutationObserver;
		window.MutationObserver = class extends Native {
			observe(...args) {
				liveObservers += 1;
				this._tracked = true;
				return super.observe(...args);
			}
			disconnect() {
				if (this._tracked) {
					liveObservers -= 1;
					this._tracked = false;
				}
				return super.disconnect();
			}
		};
		const handlers = (target) => {
			const events = $._data(target, "events");
			if (!events) return 0;
			return Object.values(events).reduce((sum, list) => sum + list.length, 0);
		};
		const start = { observers: liveObservers, document: handlers(document), window: handlers(window) };
		for (let i = 0; i < 12; i++) {
			openControl("Date", "1831-03-21");
			control.jalali_picker.hide();
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
		return {
			start,
			end: { observers: liveObservers, document: handlers(document), window: handlers(window) },
			containers: document.querySelectorAll(".datepicker-container").length,
		};
	});
	expect(result.containers).toBe(0);
	expect(result.end.observers).toBe(result.start.observers);
	expect(result.end.document).toBe(result.start.document);
	expect(result.end.window).toBe(result.start.window);
});
