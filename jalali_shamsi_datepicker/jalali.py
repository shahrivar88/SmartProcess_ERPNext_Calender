# Integer port of jalali_core.js (jalaali-js). Keep this file aligned with that engine.
from __future__ import annotations

from datetime import date

BREAKS = (
	-61,
	9,
	38,
	199,
	426,
	686,
	756,
	818,
	1111,
	1181,
	1210,
	1635,
	2060,
	2097,
	2192,
	2262,
	2324,
	2394,
	2456,
	3178,
)
MIN_JALALI_YEAR = 1200
MAX_JALALI_YEAR = 1599


def _div(a: int, b: int) -> int:
	# jalaali-js uses ~~(a / b): truncate toward zero, not Python floor division.
	q = abs(a) // abs(b)
	return q if (a < 0) == (b < 0) else -q


def _mod(a: int, b: int) -> int:
	return a - _div(a, b) * b


def jal_cal(jy: int) -> dict[str, int]:
	bl = len(BREAKS)
	gy = jy + 621
	leap_j = -14
	jp = BREAKS[0]
	jump = 0

	if jy < jp or jy >= BREAKS[bl - 1]:
		raise ValueError(f"Invalid Jalali year {jy}")

	jm = BREAKS[1]
	for i in range(1, bl):
		jm = BREAKS[i]
		jump = jm - jp
		if jy < jm:
			break
		leap_j = leap_j + _div(jump, 33) * 8 + _div(_mod(jump, 33), 4)
		jp = jm

	n = jy - jp
	leap_j = leap_j + _div(n, 33) * 8 + _div(_mod(n, 33) + 3, 4)
	if _mod(jump, 33) == 4 and jump - n == 4:
		leap_j += 1
	leap_g = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150
	march = 20 + leap_j - leap_g
	if jump - n < 6:
		n = n - jump + _div(jump + 4, 33) * 33
	leap = _mod(_mod(n + 1, 33) - 1, 4)
	if leap == -1:
		leap = 4
	return {"leap": leap, "gy": gy, "march": march}


def g2d(gy: int, gm: int, gd: int) -> int:
	d = (
		_div((gy + _div(gm - 8, 6) + 100100) * 1461, 4)
		+ _div(153 * _mod(gm + 9, 12) + 2, 5)
		+ gd
		- 34840408
	)
	return d - _div(_div(gy + 100100 + _div(gm - 8, 6), 100) * 3, 4) + 752


def d2g(jdn: int) -> tuple[int, int, int]:
	j = 4 * jdn + 139361631
	j = j + _div(_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
	i = _div(_mod(j, 1461), 4) * 5 + 308
	gd = _div(_mod(i, 153), 5) + 1
	gm = _mod(_div(i, 153), 12) + 1
	gy = _div(j, 1461) - 100100 + _div(8 - gm, 6)
	return gy, gm, gd


def j2d(jy: int, jm: int, jd: int) -> int:
	r = jal_cal(jy)
	return g2d(r["gy"], 3, r["march"]) + (jm - 1) * 31 - _div(jm, 7) * (jm - 7) + jd - 1


def d2j(jdn: int) -> tuple[int, int, int]:
	gy = d2g(jdn)[0]
	jy = gy - 621
	r = jal_cal(jy)
	jdn1f = g2d(gy, 3, r["march"])
	k = jdn - jdn1f
	if k >= 0:
		if k <= 185:
			jm = 1 + _div(k, 31)
			jd = _mod(k, 31) + 1
			return jy, jm, jd
		k -= 186
	else:
		jy -= 1
		k += 179
		if r["leap"] == 1:
			k += 1
	jm = 7 + _div(k, 30)
	jd = _mod(k, 30) + 1
	return jy, jm, jd


def is_leap_jalali_year(jy: int) -> bool:
	return jal_cal(jy)["leap"] == 0


def jalali_month_length(jy: int, jm: int) -> int:
	if jm <= 6:
		return 31
	if jm <= 11:
		return 30
	return 30 if is_leap_jalali_year(jy) else 29


def is_supported_jalali_year(jy: int) -> bool:
	return isinstance(jy, int) and MIN_JALALI_YEAR <= jy <= MAX_JALALI_YEAR


def is_valid_jalali_date(jy: int, jm: int, jd: int) -> bool:
	return (
		isinstance(jy, int)
		and isinstance(jm, int)
		and isinstance(jd, int)
		and is_supported_jalali_year(jy)
		and 1 <= jm <= 12
		and 1 <= jd <= jalali_month_length(jy, jm)
	)


def jalali_to_gregorian(jy: int, jm: int, jd: int) -> tuple[int, int, int]:
	return d2g(j2d(jy, jm, jd))


def gregorian_to_jalali(gy: int, gm: int, gd: int) -> tuple[int, int, int]:
	date(gy, gm, gd)
	check = d2g(g2d(gy, gm, gd))
	if check != (gy, gm, gd):
		raise ValueError(f"Invalid Gregorian date {gy:04d}-{gm:02d}-{gd:02d}")
	jy, jm, jd = d2j(g2d(gy, gm, gd))
	if not is_supported_jalali_year(jy):
		raise ValueError(f"Jalali year {jy} is outside {MIN_JALALI_YEAR}-{MAX_JALALI_YEAR}")
	return jy, jm, jd


def gregorian_to_jalali_string(iso_date: str) -> str:
	parts = str(iso_date or "").strip().split("-")
	if len(parts) != 3:
		raise ValueError(f"Invalid Gregorian date {iso_date}")
	gy, gm, gd = (int(parts[0]), int(parts[1]), int(parts[2]))
	jy, jm, jd = gregorian_to_jalali(gy, gm, gd)
	return f"{jy}/{jm:02d}/{jd:02d}"


def jalali_to_gregorian_string(jy: int, jm: int, jd: int) -> str:
	gy, gm, gd = jalali_to_gregorian(jy, jm, jd)
	return f"{gy:04d}-{gm:02d}-{gd:02d}"


if __name__ == "__main__":
	import sys

	for raw in sys.stdin:
		iso = raw.strip()
		if not iso:
			continue
		print(gregorian_to_jalali_string(iso))
