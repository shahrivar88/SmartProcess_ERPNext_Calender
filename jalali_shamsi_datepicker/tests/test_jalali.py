from __future__ import annotations

import unittest
from datetime import date, timedelta

from jalali_shamsi_datepicker.jalali import (
	MAX_JALALI_YEAR,
	MIN_JALALI_YEAR,
	gregorian_to_jalali,
	gregorian_to_jalali_string,
	is_leap_jalali_year,
	is_valid_jalali_date,
	jalali_month_length,
	jalali_to_gregorian_string,
)


class TestJalaliMapping(unittest.TestCase):
	def test_years_1403_to_1405_and_nowruz(self):
		self.assertEqual(gregorian_to_jalali_string("2025-03-20"), "1403/12/30")
		self.assertEqual(gregorian_to_jalali_string("2025-03-21"), "1404/01/01")
		self.assertEqual(gregorian_to_jalali_string("2026-03-20"), "1404/12/29")
		self.assertEqual(gregorian_to_jalali_string("2026-03-21"), "1405/01/01")
		self.assertEqual(gregorian_to_jalali_string("2026-11-01"), "1405/08/10")

	def test_esfand_29_and_30(self):
		self.assertTrue(is_leap_jalali_year(1403))
		self.assertFalse(is_leap_jalali_year(1404))
		self.assertEqual(jalali_month_length(1403, 12), 30)
		self.assertEqual(jalali_month_length(1404, 12), 29)
		self.assertTrue(is_valid_jalali_date(1403, 12, 30))
		self.assertFalse(is_valid_jalali_date(1404, 12, 30))
		self.assertEqual(jalali_to_gregorian_string(1403, 12, 30), "2025-03-20")
		self.assertEqual(jalali_to_gregorian_string(1404, 12, 29), "2026-03-20")

	def test_supported_bounds(self):
		self.assertEqual(gregorian_to_jalali_string("1821-03-21"), "1200/01/01")
		self.assertEqual(gregorian_to_jalali(2221, 3, 20)[0], MAX_JALALI_YEAR)
		self.assertEqual(MIN_JALALI_YEAR, 1200)

	def test_unsupported_dates_do_not_fallback(self):
		with self.assertRaises(ValueError):
			gregorian_to_jalali(1821, 3, 20)
		with self.assertRaises(ValueError):
			gregorian_to_jalali(2221, 3, 21)
		with self.assertRaises(ValueError):
			gregorian_to_jalali(2026, 2, 30)

	def test_ascii_zero_padding(self):
		text = gregorian_to_jalali_string("2026-03-21")
		self.assertEqual(text, "1405/01/01")
		self.assertTrue(all(ch in "0123456789/" for ch in text))

	def test_round_trip_supported_span_sample(self):
		day = date(2025, 3, 20)
		end = date(2026, 3, 22)
		while day <= end:
			iso = day.isoformat()
			jy, jm, jd = gregorian_to_jalali(day.year, day.month, day.day)
			self.assertEqual(jalali_to_gregorian_string(jy, jm, jd), iso)
			day += timedelta(days=1)


if __name__ == "__main__":
	unittest.main()
