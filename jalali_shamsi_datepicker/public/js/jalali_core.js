// Pure Jalali <-> Gregorian conversion and input parsing.
// No DOM or Frappe dependency so it can be unit tested with Node.
// Conversion algorithm: jalaali-js (MIT), https://github.com/jalaali/jalaali-js
(function (root, factory) {
	const api = factory();
	if (typeof module === "object" && module.exports) {
		module.exports = api;
	} else {
		root.jalali_shamsi_datepicker = root.jalali_shamsi_datepicker || {};
		root.jalali_shamsi_datepicker.core = api;
	}
})(typeof self !== "undefined" ? self : this, function () {
	const BREAKS = [
		-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324,
		2394, 2456, 3178,
	];

	// Jalali years accepted from user input; keeps them apart from Gregorian years (19xx/20xx).
	const MIN_JALALI_YEAR = 1200;
	const MAX_JALALI_YEAR = 1599;

	function div(a, b) {
		return ~~(a / b);
	}

	function mod(a, b) {
		return a - ~~(a / b) * b;
	}

	function jalCal(jy) {
		const bl = BREAKS.length;
		const gy = jy + 621;
		let leapJ = -14;
		let jp = BREAKS[0];
		let jm;
		let jump;
		let leap;
		let n;

		if (jy < jp || jy >= BREAKS[bl - 1]) {
			throw new Error("Invalid Jalali year " + jy);
		}
		for (let i = 1; i < bl; i += 1) {
			jm = BREAKS[i];
			jump = jm - jp;
			if (jy < jm) break;
			leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
			jp = jm;
		}
		n = jy - jp;
		leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
		if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
		const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
		const march = 20 + leapJ - leapG;
		if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
		leap = mod(mod(n + 1, 33) - 1, 4);
		if (leap === -1) leap = 4;
		return { leap, gy, march };
	}

	function g2d(gy, gm, gd) {
		let d =
			div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
			div(153 * mod(gm + 9, 12) + 2, 5) +
			gd -
			34840408;
		d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
		return d;
	}

	function d2g(jdn) {
		let j = 4 * jdn + 139361631;
		j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
		const i = div(mod(j, 1461), 4) * 5 + 308;
		const gd = div(mod(i, 153), 5) + 1;
		const gm = mod(div(i, 153), 12) + 1;
		const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
		return { gy, gm, gd };
	}

	function j2d(jy, jm, jd) {
		const r = jalCal(jy);
		return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
	}

	function d2j(jdn) {
		const gy = d2g(jdn).gy;
		let jy = gy - 621;
		const r = jalCal(jy);
		const jdn1f = g2d(gy, 3, r.march);
		let jd;
		let jm;
		let k = jdn - jdn1f;
		if (k >= 0) {
			if (k <= 185) {
				jm = 1 + div(k, 31);
				jd = mod(k, 31) + 1;
				return { jy, jm, jd };
			}
			k -= 186;
		} else {
			jy -= 1;
			k += 179;
			if (r.leap === 1) k += 1;
		}
		jm = 7 + div(k, 30);
		jd = mod(k, 30) + 1;
		return { jy, jm, jd };
	}

	function isLeapJalaliYear(jy) {
		return jalCal(jy).leap === 0;
	}

	function jalaliMonthLength(jy, jm) {
		if (jm <= 6) return 31;
		if (jm <= 11) return 30;
		return isLeapJalaliYear(jy) ? 30 : 29;
	}

	function isValidJalaliDate(jy, jm, jd) {
		return (
			Number.isInteger(jy) &&
			Number.isInteger(jm) &&
			Number.isInteger(jd) &&
			jy >= MIN_JALALI_YEAR &&
			jy <= MAX_JALALI_YEAR &&
			jm >= 1 &&
			jm <= 12 &&
			jd >= 1 &&
			jd <= jalaliMonthLength(jy, jm)
		);
	}

	function pad(n) {
		return String(n).padStart(2, "0");
	}

	function normalizeDigits(value) {
		return String(value)
			.replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
			.replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
			.trim();
	}

	// Escapes a user-supplied string before it is interpolated into an HTML context
	// (e.g. the frappe.msgprint message for a rejected Jalali date).
	function escapeHtml(value) {
		return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => {
			switch (c) {
				case "&":
					return "&amp;";
				case "<":
					return "&lt;";
				case ">":
					return "&gt;";
				case '"':
					return "&quot;";
				default:
					return "&#39;";
			}
		});
	}

	// Local-midnight unix timestamp for a "YYYY-MM-DD" Gregorian string, or null when
	// not parseable / not a real calendar day (never rolls 2026-02-30 over to March).
	function gregorianDateStringToTimestamp(isoDate) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || "").trim());
		if (!m) return null;
		const gy = Number(m[1]);
		const gm = Number(m[2]);
		const gd = Number(m[3]);
		const d = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
		if (d.getFullYear() !== gy || d.getMonth() !== gm - 1 || d.getDate() !== gd) return null;
		return d.getTime();
	}

	// "YYYY-MM-DD" for the local calendar day of a unix timestamp (used to compare the
	// picker's day-cell timestamps against df.disabled_dates without timezone drift).
	function timestampToGregorianDateString(ms) {
		const d = new Date(ms);
		return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
	}

	// Set of "YYYY-MM-DD" days to disable in the picker, or null when there are none.
	function disabledDatesSet(list) {
		if (!Array.isArray(list) || !list.length) return null;
		const set = new Set();
		for (const item of list) {
			const iso = String(item == null ? "" : item).trim();
			if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) set.add(iso);
		}
		return set.size ? set : null;
	}

	// "YYYY-MM-DD" (Gregorian) -> "YYYY/MM/DD" (Jalali); "" for anything unparsable.
	function gregorianToJalaliString(isoDate) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || "").trim());
		if (!m) return "";
		const gy = Number(m[1]);
		const gm = Number(m[2]);
		const gd = Number(m[3]);
		const check = d2g(g2d(gy, gm, gd));
		if (check.gy !== gy || check.gm !== gm || check.gd !== gd) return "";
		const j = d2j(g2d(gy, gm, gd));
		return j.jy + "/" + pad(j.jm) + "/" + pad(j.jd);
	}

	function jalaliToGregorianString(jy, jm, jd) {
		const g = d2g(j2d(jy, jm, jd));
		return g.gy + "-" + pad(g.gm) + "-" + pad(g.gd);
	}

	// Compact "YYYYMMDD" (exactly 8 digits). Digits 5-8 inside 1900-2100 are a Gregorian
	// year typed as DDMMYYYY/MMDDYYYY; a valid Jalali MMDD is at most 1231, so no real
	// Jalali date is ever lost to that exclusion.
	function matchCompactJalali(text) {
		const m = /^(\d{4})(\d{2})(\d{2})(?:[\sT]+(.+))?$/.exec(text);
		if (!m) return null;
		const tail = Number(m[2] + m[3]);
		return tail >= 1900 && tail <= 2100 ? null : m;
	}

	/**
	 * Parse user input that may be a Jalali date, optionally followed by a time part.
	 * Accepts separated "YYYY/MM/DD" (also "-" or ".") and compact "YYYYMMDD".
	 *
	 * Returns:
	 *   null                                   input is not Jalali-shaped (let Frappe handle it)
	 *   { valid: false, input }                Jalali-shaped but impossible (e.g. 1403/12/31 in a common year)
	 *   { valid: true, gregorian, time }       gregorian is "YYYY-MM-DD", time is the untouched remainder
	 */
	function parseJalaliInput(value) {
		if (value == null) return null;
		const text = normalizeDigits(value);
		const m =
			/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[\sT]+(.+))?$/.exec(text) ||
			matchCompactJalali(text);
		if (!m) return null;
		const jy = Number(m[1]);
		if (jy < MIN_JALALI_YEAR || jy > MAX_JALALI_YEAR) return null;
		const jm = Number(m[2]);
		const jd = Number(m[3]);
		const time = m[4] ? m[4].trim() : "";
		if (!isValidJalaliDate(jy, jm, jd)) {
			return { valid: false, input: text };
		}
		return { valid: true, gregorian: jalaliToGregorianString(jy, jm, jd), time };
	}

	// Typing a Gregorian date in ISO-ish form (any digit system) should keep working like
	// Frappe's own parse; e.g. "2026/09/24" or Persian-digit "۲۰۲۶/۰۹/۲۴ ۱۴:۳۰". Returns
	// "YYYY-MM-DD[ HH:mm:ss]" (zero-padded) or null when unparsable/unverifiable.
	function normalizeGregorianInput(value) {
		if (value == null) return null;
		const text = normalizeDigits(value);
		const m = /^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:[\sT]+(.+))?$/.exec(text);
		if (!m) return null;
		const gy = Number(m[1]);
		// Years in the Jalali band are handled by parseJalaliInput; Gregorian years are
		// unmistakable in the 1900-2100 range.
		if (gy < 1900 || gy > 2100) return null;
		const gm = Number(m[2]);
		const gd = Number(m[3]);
		const check = d2g(g2d(gy, gm, gd));
		if (check.gy !== gy || check.gm !== gm || check.gd !== gd) return null;
		let iso = gy + "-" + pad(gm) + "-" + pad(gd);
		const time = m[4] ? m[4].trim() : "";
		if (time) {
			const tp = time.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?(.*)$/);
			if (tp) {
				const h = Math.min(Number(tp[1]) || 0, 23);
				const mi = Math.min(Number(tp[2]) || 0, 59);
				const s = Math.min(Number(tp[3]) || 0, 59);
				iso += " " + pad(h) + ":" + pad(mi) + ":" + pad(s) + (tp[4] || "");
			}
		}
		return iso;
	}

	return {
		normalizeDigits,
		escapeHtml,
		gregorianDateStringToTimestamp,
		timestampToGregorianDateString,
		disabledDatesSet,
		isLeapJalaliYear,
		jalaliMonthLength,
		isValidJalaliDate,
		gregorianToJalaliString,
		jalaliToGregorianString,
		parseJalaliInput,
		normalizeGregorianInput,
	};
});
