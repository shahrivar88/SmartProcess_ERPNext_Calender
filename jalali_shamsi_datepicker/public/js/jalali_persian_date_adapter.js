// Make vendored persian-date 1.1.0 use jalali_core.js for every Persian conversion.
//
// persian-datepicker 1.2.0 constructs dates through the global persianDate API
// (Date/unix -> _gDateToCalculators, Jalali array -> algorithmsCalc, Esfand length
// via isLeapYear). Both of the vendor's leap modes disagree with the core on
// known year-pairs; this adapter overwrites those three hooks so display, month
// length, navigation and format() all follow the same mapping as parseJalaliInput.
// The minified vendor files are not edited.
(function (root, factory) {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	} else {
		root.jalali_shamsi_datepicker = root.jalali_shamsi_datepicker || {};
		root.jalali_shamsi_datepicker.persianDateAdapter = api;
		if (root.persianDate && root.jalali_shamsi_datepicker.core) {
			api.install(root.persianDate, root.jalali_shamsi_datepicker.core);
		}
	}
})(typeof self !== "undefined" ? self : this, function () {
	function pad(n) {
		return String(n).padStart(2, "0");
	}

	function civilFromIso(iso) {
		if (!iso) return null;
		const parts = String(iso).split("-").map(Number);
		if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
		return { gy: parts[0], gm: parts[1], gd: parts[2] };
	}

	function jalaliFromIso(core, gy, gm, gd) {
		const text = core.gregorianToJalaliString(gy + "-" + pad(gm) + "-" + pad(gd));
		if (!text) return null;
		const parts = text.split("/").map(Number);
		if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
		return { jy: parts[0], jm: parts[1], jd: parts[2] };
	}

	function gregorianFromJalali(core, jy, jm, jd) {
		try {
			return civilFromIso(core.jalaliToGregorianString(jy, jm, jd));
		} catch (err) {
			return null;
		}
	}

	function overwritePersian(instance, jy, jm, jd, core) {
		const leap = !!core.isLeapJalaliYear(jy);
		for (const key of ["persianAstro", "persianAlgo"]) {
			const state = instance.State && instance.State[key];
			if (!state) continue;
			// Vendor stores month 0-based; weekday stays the vendor value for this instant.
			state.year = jy;
			state.month = jm - 1;
			state.day = jd;
			state.leap = key === "persianAstro" ? leap : leap ? 1 : 0;
		}
	}

	function install(persianDate, core) {
		if (!persianDate || !core) return { installed: false, reason: "missing persianDate or core" };
		if (persianDate.__jalaliCoreAdapter) return { installed: true, skipped: true };
		const proto = persianDate.prototype;
		const originalFromDate = proto && proto._gDateToCalculators;
		const originalFromParts = proto && proto.algorithmsCalc;
		const originalLeap = proto && proto.isLeapYear;
		if (
			typeof originalFromDate !== "function" ||
			typeof originalFromParts !== "function" ||
			typeof originalLeap !== "function"
		) {
			return { installed: false, reason: "missing persianDate hooks" };
		}

		proto._gDateToCalculators = function (date) {
			originalFromDate.call(this, date);
			if (!date || typeof date.getFullYear !== "function") return;
			const jalali = jalaliFromIso(core, date.getFullYear(), date.getMonth() + 1, date.getDate());
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
				}
			}
			return originalFromParts.call(this, parts);
		};

		proto.isLeapYear = function (year) {
			if (this.calendarType === "persian") {
				const y = year === undefined ? this.year() : year;
				try {
					return !!core.isLeapJalaliYear(y);
				} catch (err) {
					return originalLeap.call(this, year);
				}
			}
			return originalLeap.call(this, year);
		};

		persianDate.__jalaliCoreAdapter = true;
		return { installed: true };
	}

	return { install };
});
