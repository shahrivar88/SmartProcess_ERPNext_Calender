// Isolated jalali_core engine for THIS app's persian-datepicker instances.
//
// persian-date 1.1.0 closes toCalendar/add/startOf over its original constructor.
// Patching the global prototype would also change unrelated window.persianDate
// consumers. Instead we build a subclass and attach it only to a picker factory.
// The minified vendor files are not edited and no third calendar is introduced.
(function (root, factory) {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	} else {
		root.jalali_shamsi_datepicker = root.jalali_shamsi_datepicker || {};
		root.jalali_shamsi_datepicker.persianDateAdapter = api;
	}
})(typeof self !== "undefined" ? self : this, function () {
	const REQUIRED_HOOKS = ["_gDateToCalculators", "algorithmsCalc", "isLeapYear"];

	function pad(n) {
		return String(n).padStart(2, "0");
	}

	function inspect(persianDate) {
		if (typeof persianDate !== "function" || !persianDate.prototype) {
			return { ok: false, reason: "persianDate is not a constructor", missing: REQUIRED_HOOKS.slice() };
		}
		const missing = REQUIRED_HOOKS.filter((name) => typeof persianDate.prototype[name] !== "function");
		if (missing.length) return { ok: false, reason: "unsupported vendor signature", missing };
		return { ok: true, missing: [] };
	}

	function civilFromIso(iso) {
		if (!iso) return null;
		const parts = String(iso).split("-").map(Number);
		if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
		return { gy: parts[0], gm: parts[1], gd: parts[2] };
	}

	function jalaliFromGregorian(core, gy, gm, gd) {
		try {
			const text = core.gregorianToJalaliString(gy + "-" + pad(gm) + "-" + pad(gd));
			if (!text) return null;
			const parts = text.split("/").map(Number);
			if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
			return { jy: parts[0], jm: parts[1], jd: parts[2] };
		} catch (err) {
			return null;
		}
	}

	function gregorianFromJalali(core, jy, jm, jd) {
		try {
			return civilFromIso(core.jalaliToGregorianString(jy, jm, jd));
		} catch (err) {
			return null;
		}
	}

	function overwritePersian(instance, jy, jm, jd, core) {
		let leap = false;
		try {
			leap = !!core.isLeapJalaliYear(jy);
		} catch (err) {
			leap = false;
		}
		for (const key of ["persianAstro", "persianAlgo"]) {
			const state = instance.State && instance.State[key];
			if (!state) continue;
			state.year = jy;
			state.month = jm - 1;
			state.day = jd;
			state.leap = key === "persianAstro" ? leap : leap ? 1 : 0;
		}
	}

	function patchIsolatedPrototype(Isolated, persianDate, core) {
		const proto = Isolated.prototype;
		const originalFromDate = persianDate.prototype._gDateToCalculators;
		const originalFromParts = persianDate.prototype.algorithmsCalc;

		proto._gDateToCalculators = function (date) {
			originalFromDate.call(this, date);
			if (!date || typeof date.getFullYear !== "function") return;
			const jalali = jalaliFromGregorian(core, date.getFullYear(), date.getMonth() + 1, date.getDate());
			if (jalali) overwritePersian(this, jalali.jy, jalali.jm, jalali.jd, core);
		};

		proto.algorithmsCalc = function (parts) {
			if (this.calendarType === "persian" && Array.isArray(parts) && parts.length) {
				const jy = Number(parts[0]);
				const jm = Number(parts[1] == null ? 1 : parts[1]);
				const jd = Number(parts[2] == null ? 1 : parts[2]);
				if (Number.isInteger(jy) && Number.isInteger(jm) && Number.isInteger(jd)) {
					const gregorian = gregorianFromJalali(core, jy, jm, jd);
					if (gregorian) {
						this._gDateToCalculators(
							new Date(
								gregorian.gy,
								gregorian.gm - 1,
								gregorian.gd,
								parts[3] || 0,
								parts[4] || 0,
								parts[5] || 0,
								parts[6] || 0
							)
						);
						return;
					}
					if (this.State) this.State.isInvalidDate = true;
					return;
				}
			}
			return originalFromParts.call(this, parts);
		};

		proto.isLeapYear = function (year) {
			if (this.calendarType !== "persian") {
				return persianDate.prototype.isLeapYear.call(this, year);
			}
			const y = year === undefined ? this.year() : year;
			try {
				return !!core.isLeapJalaliYear(y);
			} catch (err) {
				return false;
			}
		};

		// Vendor getFirstWeekDayOfMonth / startOf / endOf close over the original
		// constructor. Re-entering that constructor would apply the vendor leap table.
		proto.getFirstWeekDayOfMonth = function (year, month) {
			return new Isolated([year, month, 1]).day();
		};

		proto.startOf = function (unit) {
			const y = this.year();
			const m = this.month();
			const d = this.date();
			const h = this.hour();
			const mi = this.minute();
			const s = this.second();
			switch (String(unit)) {
				case "years":
				case "year":
					return new Isolated([y, 1, 1, 0, 0, 0, 0]);
				case "months":
				case "month":
					return new Isolated([y, m, 1, 0, 0, 0, 0]);
				case "weeks":
				case "week":
					return new Isolated(this.valueOf() - 864e5 * (this.calendar().weekday - 1));
				case "days":
				case "day":
					return new Isolated([y, m, d, 0, 0, 0, 0]);
				case "hours":
				case "hour":
					return new Isolated([y, m, d, h, 0, 0, 0]);
				case "minutes":
				case "minute":
					return new Isolated([y, m, d, h, mi, 0, 0]);
				case "seconds":
				case "second":
					return new Isolated([y, m, d, h, mi, s, 0]);
				default:
					return new Isolated([y, m, d, h, mi, s]);
			}
		};

		proto.endOf = function (unit) {
			const y = this.year();
			const m = this.month();
			const d = this.date();
			const h = this.hour();
			const mi = this.minute();
			const s = this.second();
			switch (String(unit)) {
				case "years":
				case "year":
					return new Isolated([y, 12, this.isLeapYear() ? 30 : 29, 23, 59, 59]);
				case "months":
				case "month":
					return new Isolated([y, m, this.daysInMonth(y, m), 23, 59, 59]);
				case "weeks":
				case "week":
					return this.startOf("week").add
						? new Isolated(this.startOf("week").valueOf() + 6 * 864e5)
						: new Isolated(this.valueOf());
				case "days":
				case "day":
					return new Isolated([y, m, d, 23, 59, 59]);
				case "hours":
				case "hour":
					return new Isolated([y, m, d, h, 59, 59]);
				case "minutes":
				case "minute":
					return new Isolated([y, m, d, h, mi, 59]);
				case "seconds":
				case "second":
					return new Isolated([y, m, d, h, mi, s]);
				default:
					return new Isolated([y, m, d, h, mi, s]);
			}
		};
	}

	function createIsolatedConstructor(persianDate, core) {
		if (!core) return { ok: false, reason: "missing core" };
		const checked = inspect(persianDate);
		if (!checked.ok) return checked;
		function IsolatedPersianDate(input) {
			if (!(this instanceof IsolatedPersianDate)) return new IsolatedPersianDate(input);
			persianDate.apply(this, arguments);
		}
		IsolatedPersianDate.prototype = Object.create(persianDate.prototype);
		IsolatedPersianDate.prototype.constructor = IsolatedPersianDate;
		Object.setPrototypeOf(IsolatedPersianDate, persianDate);
		IsolatedPersianDate.calendarType = "persian";
		IsolatedPersianDate.leapYearMode = persianDate.leapYearMode;
		IsolatedPersianDate.localType = persianDate.localType;
		patchIsolatedPrototype(IsolatedPersianDate, persianDate, core);
		IsolatedPersianDate.__jalaliCoreAdapter = true;
		return { ok: true, constructor: IsolatedPersianDate };
	}

	function attachToPicker(picker, isolated) {
		if (!isolated || !isolated.__jalaliCoreAdapter) {
			return { ok: false, reason: "isolated constructor required" };
		}
		const factory = picker && picker.model && picker.model.PersianDate;
		if (!factory || typeof factory.date !== "function") {
			return { ok: false, reason: "missing picker PersianDate factory" };
		}
		if (factory.__jalaliIsolated) return { ok: true, skipped: true };
		factory.date = function (input) {
			const inst = new isolated(input);
			const locale = this.model && this.model.options && this.model.options.locale_;
			if (locale && typeof inst.toLocale === "function") inst.toLocale(locale);
			return inst;
		};
		factory.__jalaliIsolated = true;
		return { ok: true };
	}

	return { inspect, createIsolatedConstructor, attachToPicker };
});
