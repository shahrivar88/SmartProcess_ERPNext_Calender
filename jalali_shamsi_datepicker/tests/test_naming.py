from __future__ import annotations

import sys
import threading
import types
import unittest
from datetime import datetime
from unittest.mock import patch

if "frappe" not in sys.modules:
	frappe_stub = types.ModuleType("frappe")
	frappe_stub._ = lambda message: message
	frappe_stub.throw = lambda message: (_ for _ in ()).throw(RuntimeError(str(message)))
	utils_stub = types.ModuleType("frappe.utils")
	utils_stub.now_datetime = datetime.now
	frappe_stub.utils = utils_stub
	sys.modules["frappe"] = frappe_stub
	sys.modules["frappe.utils"] = utils_stub

from jalali_shamsi_datepicker import naming
from jalali_shamsi_datepicker.jalali import gregorian_to_jalali


def _parse_series(series: str, now: datetime, counters: dict[str, int] | None = None) -> str:
	"""Mirror Frappe parse_naming_series + getseries for the tokens this app owns."""
	if counters is None:
		counters = {}
	name = ""
	series_set = False
	jy, jm, jd = gregorian_to_jalali(now.year, now.month, now.day)
	tokens = {
		"JYYYY": f"{jy:04d}",
		"JYY": f"{jy % 100:02d}",
		"JMM": f"{jm:02d}",
		"JDD": f"{jd:02d}",
		"YYYY": now.strftime("%Y"),
		"YY": now.strftime("%y"),
		"MM": now.strftime("%m"),
		"DD": now.strftime("%d"),
	}
	for part in series.split("."):
		if not part:
			continue
		if part.startswith("#"):
			if series_set:
				continue
			digits = len(part)
			counters[name] = counters.get(name, 0) + 1
			name += f"{counters[name]:0{digits}d}"
			series_set = True
		elif part in tokens:
			name += tokens[part]
		else:
			name += part
	return name


class TestNamingTokens(unittest.TestCase):
	def test_all_four_tokens_for_1405(self):
		now = datetime(2026, 11, 1, 14, 30, 5)
		with patch.object(naming, "now_datetime", return_value=now):
			self.assertEqual(naming.naming_jyyyy(None, "JYYYY"), "1405")
			self.assertEqual(naming.naming_jyy(None, "JYY"), "05")
			self.assertEqual(naming.naming_jmm(None, "JMM"), "08")
			self.assertEqual(naming.naming_jdd(None, "JDD"), "10")

	def test_tokens_use_ascii_digits(self):
		now = datetime(2026, 3, 21, 8, 0, 0)
		with patch.object(naming, "now_datetime", return_value=now):
			for value in (
				naming.naming_jyyyy(),
				naming.naming_jyy(),
				naming.naming_jmm(),
				naming.naming_jdd(),
			):
				self.assertTrue(value.isdigit())
				self.assertTrue(all("0" <= ch <= "9" for ch in value))

	def test_unsupported_date_raises(self):
		now = datetime(1821, 3, 20, 12, 0, 0)

		def throw(message):
			raise RuntimeError(str(message))

		with patch.object(naming, "now_datetime", return_value=now):
			with patch.object(naming.frappe, "throw", side_effect=throw):
				with self.assertRaises(RuntimeError):
					naming.naming_jyyyy()

	def test_combined_pattern_and_preview(self):
		now = datetime(2026, 3, 21, 9, 0, 0)
		series = "SINV-.JYYYY.-.JMM.-.JDD.-.#####"
		preview = [_parse_series(series, now) for _ in range(3)]
		# Each call uses a fresh counter map, like NamingSeries.get_preview.
		self.assertEqual(preview, ["SINV-1405-01-01-00001"] * 3)
		counters = {}
		names = [_parse_series(series, now, counters) for _ in range(3)]
		self.assertEqual(
			names,
			["SINV-1405-01-01-00001", "SINV-1405-01-01-00002", "SINV-1405-01-01-00003"],
		)

	def test_year_rollover_uses_separate_prefix(self):
		before = datetime(2026, 3, 20, 23, 59, 0)
		after = datetime(2026, 3, 21, 0, 1, 0)
		counters = {}
		first = _parse_series("SINV-.JYYYY.-.#####", before, counters)
		second = _parse_series("SINV-.JYYYY.-.#####", after, counters)
		self.assertEqual(first, "SINV-1404-00001")
		self.assertEqual(second, "SINV-1405-00001")
		self.assertEqual(set(counters), {"SINV-1404-", "SINV-1405-"})

	def test_gregorian_tokens_stay_independent(self):
		now = datetime(2026, 11, 1, 10, 0, 0)
		self.assertEqual(_parse_series("SINV-.YYYY.-.#####", now), "SINV-2026-00001")
		self.assertEqual(_parse_series("SINV-.YY.-.MM.-.DD.-.#####", now), "SINV-26-11-01-00001")
		self.assertEqual(_parse_series("SINV-.JYYYY.-.#####", now), "SINV-1405-00001")

	def test_companies_and_doctypes_do_not_share_counters(self):
		now = datetime(2026, 3, 21, 10, 0, 0)
		counters = {}
		sales = _parse_series("SINV-.JYYYY.-.#####", now, counters)
		purchase = _parse_series("PINV-.JYYYY.-.#####", now, counters)
		other_company = _parse_series("ACC-.JYYYY.-.#####", now, counters)
		self.assertEqual(sales, "SINV-1405-00001")
		self.assertEqual(purchase, "PINV-1405-00001")
		self.assertEqual(other_company, "ACC-1405-00001")

	def test_same_year_increments_without_custom_backend(self):
		now = datetime(2026, 6, 1, 10, 0, 0)
		counters = {}
		names = [_parse_series("SINV-.JYYYY.-.#####", now, counters) for _ in range(5)]
		self.assertEqual(names[-1], "SINV-1405-00005")
		self.assertEqual(counters["SINV-1405-"], 5)

	def test_concurrent_generation_does_not_duplicate(self):
		lock = threading.Lock()
		counters: dict[str, int] = {}
		names: list[str] = []
		now = datetime(2026, 3, 21, 10, 0, 0)

		def mint():
			with lock:
				names.append(_parse_series("SINV-.JYYYY.-.#####", now, counters))

		threads = [threading.Thread(target=mint) for _ in range(20)]
		for thread in threads:
			thread.start()
		for thread in threads:
			thread.join()
		self.assertEqual(len(names), 20)
		self.assertEqual(len(set(names)), 20)
		self.assertEqual(sorted(names)[0], "SINV-1405-00001")
		self.assertEqual(sorted(names)[-1], "SINV-1405-00020")


if __name__ == "__main__":
	unittest.main()
