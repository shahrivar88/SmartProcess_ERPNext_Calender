# Frappe naming_series_variables callbacks. Each token is resolved from now_datetime().
from __future__ import annotations

from datetime import datetime

import frappe
from frappe import _
from frappe.utils import now_datetime

from jalali_shamsi_datepicker.jalali import gregorian_to_jalali


def jalali_naming_parts(now: datetime | None = None) -> tuple[int, int, int]:
	current = now or now_datetime()
	try:
		return gregorian_to_jalali(current.year, current.month, current.day)
	except ValueError as exc:
		frappe.throw(
			_("Jalali naming series cannot use {0}: {1}").format(current.date().isoformat(), str(exc))
		)
		raise


def naming_jyyyy(doc=None, e: str = "JYYYY") -> str:
	return f"{jalali_naming_parts()[0]:04d}"


def naming_jyy(doc=None, e: str = "JYY") -> str:
	return f"{jalali_naming_parts()[0] % 100:02d}"


def naming_jmm(doc=None, e: str = "JMM") -> str:
	return f"{jalali_naming_parts()[1]:02d}"


def naming_jdd(doc=None, e: str = "JDD") -> str:
	return f"{jalali_naming_parts()[2]:02d}"
