# Disposable-site integration for jalali naming tokens. Not a production script.
from __future__ import annotations

import json
import threading
from datetime import datetime
from unittest.mock import patch

import frappe
from frappe.model.naming import NamingSeries, make_autoname, parse_naming_series

CASES = {
	"end_1403": datetime(2025, 3, 20, 23, 59, 0),
	"start_1404": datetime(2025, 3, 21, 0, 1, 0),
	"end_1404": datetime(2026, 3, 20, 23, 59, 0),
	"start_1405": datetime(2026, 3, 21, 0, 1, 0),
	"aban_10": datetime(2026, 11, 1, 14, 30, 5),
}


def _freeze(now: datetime):
	return (
		patch("frappe.model.naming.now_datetime", return_value=now),
		patch("jalali_shamsi_datepicker.naming.now_datetime", return_value=now),
		patch("frappe.utils.now_datetime", return_value=now),
		patch("erpnext.accounts.utils.now_datetime", return_value=now),
	)


def _series_rows():
	return frappe.get_all("Series", fields=["name", "current"], order_by="name")


def main() -> int:
	frappe.init(site="jalali_ui_test")
	frappe.connect()
	frappe.clear_cache()
	report = {}
	try:
		hooks = frappe.get_hooks("naming_series_variables")
		report["hooks"] = {k: hooks.get(k) for k in ("JYYYY", "JYY", "JMM", "JDD", "YYYY", "YY", "MM", "DD")}
		for token in ("JYYYY", "JYY", "JMM", "JDD"):
			if not hooks.get(token):
				raise RuntimeError(f"missing hook {token}")

		before = _series_rows()
		report["series_before"] = before
		report["tokens"] = {}
		report["preview"] = {}
		report["generated"] = {}

		for label, now in CASES.items():
			patches = _freeze(now)
			for p in patches:
				p.start()
			try:
				from jalali_shamsi_datepicker.naming import naming_jdd, naming_jmm, naming_jyy, naming_jyyyy

				tokens = {
					"JYYYY": naming_jyyyy(None, "JYYYY"),
					"JYY": naming_jyy(None, "JYY"),
					"JMM": naming_jmm(None, "JMM"),
					"JDD": naming_jdd(None, "JDD"),
					"YYYY": parse_naming_series(["YYYY"]),
					"YY": parse_naming_series(["YY"]),
					"MM": parse_naming_series(["MM"]),
					"DD": parse_naming_series(["DD"]),
				}
				report["tokens"][label] = {"now": now.isoformat(), **tokens}
				series = NamingSeries("JAL-.JYYYY.-.JMM.-.JDD.-.#####")
				preview = series.get_preview()
				report["preview"][label] = preview
				name = make_autoname("JAL-.JYYYY.-.#####", doc=None)
				report["generated"][label] = name
			finally:
				for p in patches:
					p.stop()

		# Repeated inserts in the same Jalali year.
		now = CASES["start_1405"]
		patches = _freeze(now)
		for p in patches:
			p.start()
		try:
			repeat = [make_autoname("JALR-.JYYYY.-.#####") for _ in range(3)]
			report["repeat_1405"] = repeat
			gregorian = [make_autoname("JALG-.YYYY.-.#####") for _ in range(2)]
			report["repeat_yyyy"] = gregorian
			after_preview = NamingSeries("JALR-.JYYYY.-.#####").get_preview()
			report["preview_after_repeat"] = after_preview
			report["series_mid"] = _series_rows()
		finally:
			for p in patches:
				p.stop()

		# Concurrent inserts share one Frappe DB lock path.
		now = CASES["aban_10"]
		names = []
		errors = []

		def mint():
			try:
				frappe.init(site="jalali_ui_test")
				frappe.connect()
				patches = _freeze(now)
				for p in patches:
					p.start()
				try:
					names.append(make_autoname("JALC-.JYYYY.-.#####"))
					frappe.db.commit()
				finally:
					for p in patches:
						p.stop()
					frappe.destroy()
			except Exception as exc:
				errors.append(repr(exc))

		threads = [threading.Thread(target=mint) for _ in range(8)]
		for thread in threads:
			thread.start()
		for thread in threads:
			thread.join()
		report["concurrent"] = {"names": sorted(names), "unique": len(set(names)), "errors": errors}

		# Unsupported date must fail.
		bad = datetime(1821, 3, 20, 12, 0, 0)
		patches = _freeze(bad)
		for p in patches:
			p.start()
		try:
			try:
				from jalali_shamsi_datepicker.naming import naming_jyyyy

				naming_jyyyy()
				report["unsupported"] = "FAILED_TO_THROW"
			except Exception as exc:
				report["unsupported"] = str(exc)
		finally:
			for p in patches:
				p.stop()

		report["series_after"] = _series_rows()
		report["todo_count"] = frappe.db.count("ToDo")
		report["sinv_count"] = frappe.db.count("Sales Invoice")
		print(json.dumps(report, indent=2, default=str))
		if report["concurrent"]["unique"] != len(report["concurrent"]["names"]) or report["concurrent"]["errors"]:
			return 2
		if report["unsupported"] == "FAILED_TO_THROW":
			return 3
		if report["tokens"]["start_1405"]["JYYYY"] != "1405":
			return 4
		return 0
	finally:
		frappe.destroy()


if __name__ == "__main__":
	raise SystemExit(main())
