from __future__ import annotations

import json
import threading
from datetime import datetime
from unittest.mock import patch

import frappe

NOW = datetime(2026, 11, 1, 14, 30, 5)


def init_site():
	frappe.init(site="jalali_ui_test", is_request=True)
	frappe.connect()


def freeze():
	return (
		patch("frappe.model.naming.now_datetime", return_value=NOW),
		patch("jalali_shamsi_datepicker.naming.now_datetime", return_value=NOW),
		patch("frappe.utils.now_datetime", return_value=NOW),
		patch("erpnext.accounts.utils.now_datetime", return_value=NOW),
	)


def mint(bucket, errors):
	try:
		init_site()
		patches = freeze()
		for p in patches:
			p.start()
		try:
			from frappe.model.naming import make_autoname

			name = None
			for attempt in range(5):
				try:
					name = make_autoname("JALC2-.JYYYY.-.#####")
					frappe.db.commit()
					break
				except frappe.QueryDeadlockError:
					frappe.db.rollback()
			if name:
				bucket.append(name)
			else:
				errors.append("retry_exhausted")
		finally:
			for p in patches:
				p.stop()
			frappe.destroy()
	except Exception as exc:
		errors.append(repr(exc))


def main() -> int:
	init_site()
	before = frappe.db.sql("select name, current from `tabSeries` where name like 'JALC2-%'", as_dict=True)
	yyyy_now, jalali_now = None, None
	patches = freeze()
	for p in patches:
		p.start()
	try:
		from frappe.model.naming import parse_naming_series
		from jalali_shamsi_datepicker.naming import naming_jyyyy

		yyyy_now = parse_naming_series(["YYYY", "-", "MM", "-", "DD"])
		jalali_now = naming_jyyyy()
	finally:
		for p in patches:
			p.stop()
	frappe.destroy()

	names: list[str] = []
	errors: list[str] = []
	threads = [threading.Thread(target=mint, args=(names, errors)) for _ in range(8)]
	for thread in threads:
		thread.start()
	for thread in threads:
		thread.join()

	init_site()
	after = frappe.db.sql("select name, current from `tabSeries` where name like 'JALC2-%'", as_dict=True)
	frappe.destroy()
	print(
		json.dumps(
			{
				"yyyy_frozen": yyyy_now,
				"jyyyy_frozen": jalali_now,
				"before": before,
				"names": sorted(names),
				"unique": len(set(names)),
				"errors": errors,
				"after": after,
			},
			indent=2,
			default=str,
		)
	)
	if errors or len(names) != 8 or len(set(names)) != 8:
		return 2
	if yyyy_now != "2026-11-01" or jalali_now != "1405":
		return 3
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
