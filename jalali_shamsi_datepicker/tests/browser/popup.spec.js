const { test, expect } = require('@playwright/test');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');

test('empty field first-open day timestamps match their Jalali labels before Today', async ({ page }) => {
  const dates = await page.evaluate(() => {
    // Force the global constructor into Gregorian first: this is the production
    // failure mode when something else (or an earlier picker path) left
    // persianDate.calendarType !== 'persian'. Empty fields do not call setDate,
    // so day cells must still come from the picker instance factory.
    persianDate.toCalendar('gregorian');
    openControl('Date', '');
    const core = jalali_shamsi_datepicker.core;
    return control.$jalali_container.find('.table-days td').toArray().map(el => {
      const rawDate = el.dataset.date || '';
      const rawUnix = el.dataset.unix;
      const parts = rawDate.split(',');
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      const parsed =
        year && month && day ? core.parseJalaliInput(`${year}/${month}/${day}`) : null;
      return {
        label: rawDate,
        unix: rawUnix,
        otherMonth: el.classList.contains('other-month'),
        actual: core.timestampToGregorianDateString(Number(rawUnix)),
        expected: parsed && parsed.valid ? parsed.gregorian : null,
        parseOk: !!(parsed && parsed.valid),
      };
    });
  });
  expect(dates.length).toBeGreaterThan(27);
  for (const date of dates) {
    expect(date.parseOk, `cell ${date.label} unix=${date.unix} did not parse as Jalali`).toBe(true);
    expect(date.actual, `cell ${date.label} unix=${date.unix}`).toBe(date.expected);
    // Guard the original production bug: Jalali year must not be treated as Gregorian CE.
    const year = Number(String(date.label).split(',')[0]);
    if (year >= 1200 && year <= 1599) {
      const asGregorianYear = new Date(Number(date.unix)).getUTCFullYear();
      expect(asGregorianYear, `cell ${date.label} unix resolved to Gregorian year ${asGregorianYear}`).toBeGreaterThan(1900);
    }
  }
  // Selecting a non-today day from the empty field must write a real Gregorian model value.
  const picked = await page.evaluate(() => {
    const core = jalali_shamsi_datepicker.core;
    let model = '';
    control.get_model_value = () => model;
    control.$input.on('change.model', () => {
      model = control.parse(control.$input.val());
    });
    const todayLabel = String(control.$jalali_container.find('td.today').data('date') || '');
    const cell = control.$jalali_container
      .find('.table-days td:not(.other-month):not(.disabled)')
      .toArray()
      .map(el => ({ el, label: el.dataset.date }))
      .find(row => row.label && row.label !== todayLabel);
    if (!cell) throw new Error('no selectable non-today day cell');
    const [y, m, d] = cell.label.split(',');
    const expected = core.parseJalaliInput(`${y}/${m}/${d}`);
    $(cell.el).trigger('click');
    return {
      label: cell.label,
      input: control.$input.val(),
      model,
      expectedJalali: `${y}/${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}`,
      expectedGregorian: expected && expected.gregorian,
    };
  });
  expect(picked.expectedGregorian).toBeTruthy();
  expect(picked.input).toBe(picked.expectedJalali);
  expect(picked.model).toBe(picked.expectedGregorian);
  expect(Number(picked.model.slice(0, 4))).toBeGreaterThan(1900);
});

test('calendar numerals are Persian before first paint even when formatter starts with Latin digits', async ({ page }) => {
  const result = await page.evaluate(() => {
    const original = persianDate.prototype.format;
    persianDate.prototype.format = function (...args) {
      return jalali_shamsi_datepicker.core.normalizeDigits(original.apply(this, args));
    };
    openControl();
    const labels = () => control.$jalali_container.find('.table-days td span, .pwt-btn-switch, .month-item, .year-item').toArray().map(el => el.textContent);
    const first = labels();
    const input = control.$input.val();
    persianDate.prototype.format = original;
    control.$jalali_container.find('.pwt-btn-next').trigger('click');
    const next = labels();
    control.$jalali_container.find('.pwt-btn-switch').trigger('click');
    control.$jalali_container.find('.pwt-btn-switch').trigger('click');
    return { first, next, years: labels(), input, parsed: control.parse(input) };
  });
  for (const labels of [result.first, result.next, result.years]) {
    expect(labels.join('')).toMatch(/[۰-۹]/);
    expect(labels.join('')).not.toMatch(/[0-9٠-٩]/);
  }
  expect(result.input).toBe('1405/07/02');
  expect(result.parsed).toBe('2026-09-24');
});

test.beforeEach(async ({ page }) => {
  await page.setContent('<html><body class="jalali-calendar-enabled"><div id="host" style="position:absolute;left:330px;top:100px"><input style="width:320px;height:30px"></div></body></html>');
  await page.addScriptTag({ path: require.resolve('jquery') });
  await page.evaluate(() => {
    class ControlDate {
      format_for_input(value) { return value || ''; }
      parse(value) { return value; }
      set_date_options() {}
      set_t_for_today() {}
      set_time_options() {}
      set_disp_area() {}
    }
    window.__ = s => s;
    window.frappe = {
      boot: { jalali_calendar_enabled: true },
      ui: { form: { ControlDate, ControlDatetime: class extends ControlDate {}, ControlTime: class extends ControlDate {} } },
      form: { formatters: { Date: v => v, Datetime: v => v } },
      datetime: { user_to_str: v => v, str_to_user: v => v, now_time: () => '10:30:00' },
      router: { jq: $({}), on(event, fn) { this.jq.on(event, (e, data) => fn(data)); } },
      msgprint() {},
    };
  });
  for (const file of ['persian-date.min.js', 'persian-datepicker.min.js', 'jalali_core.js', 'jalali_controls.js']) {
    await page.addScriptTag({ path: path.join(root, 'jalali_shamsi_datepicker/public/js', file) });
  }
  for (const file of ['persian-datepicker.min.css', 'custom.css']) {
    await page.addStyleTag({ path: path.join(root, 'jalali_shamsi_datepicker/public/css', file) });
  }
  await page.evaluate(() => {
    window.openControl = (type = 'Date', model = '2026-09-24', df = {}) => {
      window.control = new frappe.ui.form['Control' + type]();
      control.df = { fieldname: 'date', ...df };
      control.$input = $('input').first();
      control.get_model_value = () => model;
      control.$input.val(control.format_for_input(model));
      control.make_picker();
      control.show_jalali_picker();
    };
    window.geometry = () => {
      const box = control.$jalali_container[0].getBoundingClientRect();
      const input = control.$input[0].getBoundingClientRect();
      return { left: box.left, width: box.width, height: box.height,
        expected: Math.max(8, Math.min(input.left + (input.width - box.width) / 2, innerWidth - box.width - 8)),
        rows: control.$jalali_container.find('.table-days tr').length };
    };
  });
});

for (const direction of ['ltr', 'rtl']) {
  test(`first frame and delayed show stay centered; five/six weeks before paint (${direction})`, async ({ page }) => {
    await page.evaluate(dir => { document.documentElement.dir = dir; openControl(); }, direction);
    const frames = await page.evaluate(async () => {
      const samples = [geometry()];
      for (let i = 0; i < 20; i++) { await new Promise(requestAnimationFrame); samples.push(geometry()); }
      control.jalali_picker.show();
      samples.push(geometry());
      return samples;
    });
    for (const frame of frames) {
      expect(frame.width).toBe(228);
      expect(Math.abs(frame.left - frame.expected)).toBeLessThanOrEqual(0.5);
      expect(frame.rows).toBe(5);
      expect(frame.height).toBe(frames[0].height);
    }
    const months = await page.evaluate(() => {
      const out = [];
      for (let m = 1; m <= 12; m++) {
        const ts = new persianDate([1405, m, 1]).valueOf();
        control.jalali_picker.setDate(ts);
        const days = new persianDate(ts);
        out.push({ ...geometry(), expectedRows: Math.max(5, Math.ceil((days.getFirstWeekDayOfMonth(1405, m) - 1 + days.daysInMonth(1405, m)) / 7)) });
      }
      return out;
    });
    expect(new Set(months.map(m => m.rows))).toEqual(new Set([5, 6]));
    for (const month of months) { expect(month.rows).toBe(month.expectedRows); expect(month.width).toBe(228); }
    expect(new Set(months.map(m => m.height)).size).toBe(2);
  });
}

test('navigation, year/month switch and wheel produce final row count synchronously', async ({ page }) => {
  await page.evaluate(() => openControl());
  const counts = await page.evaluate(() => {
    const result = [];
    for (let i = 0; i < 24; i++) {
      control.$jalali_container.find('.pwt-btn-next').trigger('click');
      result.push(geometry().rows);
      const rows = control.$jalali_container.find('.table-days tr');
      if (rows.length === 6 && rows.last().find('span:not(.other-month)').length === 0) throw Error('empty sixth row');
    }
    control.$jalali_container.find('.pwt-btn-switch').trigger('click');
    control.$jalali_container.find('.month-item').first().trigger('click');
    result.push(geometry().rows);
    return result;
  });
  expect(counts.every(n => n === 5 || n === 6)).toBeTruthy();
  await page.locator('.datepicker-grid-view').hover();
  await page.mouse.wheel(0, 120);
  expect((await page.evaluate(() => geometry())).rows).toBeGreaterThanOrEqual(5);
});

test('viewport edges clamp; modal/Quick Entry stays above backdrop', async ({ page }) => {
  for (const left of [0, 850]) {
    await page.evaluate(left => { $('#host').css('left', left); openControl(); }, left);
    const box = await page.evaluate(() => geometry());
    expect(Math.abs(box.left - box.expected)).toBeLessThanOrEqual(0.5);
    await page.evaluate(() => control.jalali_picker.hide());
  }
  await page.evaluate(() => { $('#host').addClass('modal').css({ left: 300, zIndex: 1050 }); openControl('Datetime', '2026-09-24 14:30:05'); });
  expect(await page.locator('.jalali-picker').evaluate(el => getComputedStyle(el).zIndex)).toBe('1060');
  await page.evaluate(() => $('#host').trigger('hide.bs.modal'));
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
});

test('repeat open/close cleans events, preserves host handlers and cannot reopen after close', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.evaluate(() => {
    window.hostChanges = 0;
    $('input').on('change.host', () => hostChanges++);
    openControl();
    window.eventCount = () => [document, window, $('input')[0]].reduce((n, el) => n + Object.values($._data(el, 'events') || {}).reduce((a, list) => a + list.length, 0), 0);
    control.jalali_picker.hide();
  });
  await page.waitForTimeout(20);
  const before = await page.evaluate(() => eventCount());
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => { control.show_jalali_picker(); control.jalali_picker.hide(); });
    await page.waitForTimeout(5);
  }
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => eventCount())).toBe(before);
  expect(await page.evaluate(() => Object.values($._data(frappe.router.jq[0], 'events') || {}).flat().length)).toBe(0);
  await expect(page.locator('.datepicker-container')).toHaveCount(0);
  await page.evaluate(() => $('input').trigger('change'));
  expect(await page.evaluate(() => hostChanges)).toBe(1);
  expect(errors).toEqual([]);
});

test('Date selection remains Jalali input/Gregorian parse; restrictions and datetime editing survive render', async ({ page }, testInfo) => {
  await page.evaluate(() => openControl('Date', '2026-09-24', { min_date: '2026-09-23', max_date: '2026-09-30', disabled_dates: ['2026-09-25'] }));
  expect(await page.locator('td[data-date="1405,7,3"]').getAttribute('class')).toContain('disabled');
  await page.locator('td[data-date="1405,7,4"]').click();
  expect(await page.locator('input').first().inputValue()).toBe('1405/07/04');
  expect(await page.evaluate(() => control.parse(control.$input.val()))).toBe('2026-09-26');
  await page.evaluate(() => openControl('Datetime', '2026-09-24 14:30:05'));
  await page.evaluate(() => control.$jalali_container.find('.pwt-btn-next').trigger('click'));
  await expect(page.locator('.hour-input')).toBeEditable();
  await page.locator('.hour-input').fill('۱۶');
  await page.locator('.hour-input').press('Enter');
  expect(await page.locator('input').first().inputValue()).toBe('1405/07/02 16:30:05');
  await page.locator('.hour .up-btn').click();
  await expect(page.locator('#host input')).toHaveValue('1405/07/02 17:30:05');
  await page.screenshot({ path: testInfo.outputPath('datetime-popup.png') });
});

test('grid/filter removal and route change clean their own popup; scroll and resize follow the field', async ({ page }) => {
  await page.evaluate(() => {
    $('#host').css({ width: 400, height: 180, overflow: 'auto' });
    $('input').wrap('<div style="width:800px;height:600px;padding:50px"></div>');
    openControl();
    control.only_input = true;
    $('#host').scrollLeft(70).trigger('scroll');
  });
  let box = await page.evaluate(() => geometry());
  expect(Math.abs(box.left - box.expected)).toBeLessThanOrEqual(0.5);
  await page.setViewportSize({ width: 700, height: 500 });
  await page.waitForTimeout(30);
  box = await page.evaluate(() => geometry());
  expect(Math.abs(box.left - box.expected)).toBeLessThanOrEqual(0.5);
  await page.evaluate(() => control.$input.remove());
  await expect(page.locator('.datepicker-container')).toHaveCount(0);
  await page.evaluate(() => { $('#host').html('<input>'); openControl(); frappe.router.jq.trigger('change'); });
  await expect(page.locator('.datepicker-container')).toHaveCount(0);
});

test('same-name controls own separate popups; old close cannot remove new listeners', async ({ page }) => {
  await page.evaluate(() => {
    openControl(); window.first = control; window.oldPicker = control.jalali_picker;
    $('<input style="position:absolute;left:100px;top:300px;width:200px">').appendTo('body');
    window.second = new frappe.ui.form.ControlDate();
    second.df = { fieldname: 'date' }; second.$input = $('input').last();
    second.get_model_value = () => '2026-09-24'; second.show_jalali_picker();
    first.jalali_picker.hide(); first.show_jalali_picker(); first.destroy_jalali_picker(oldPicker);
    window.control = first;
  });
  await expect(page.locator('.jalali-picker')).toHaveCount(2);
  const box = await page.evaluate(() => geometry());
  expect(Math.abs(box.left - box.expected)).toBeLessThanOrEqual(0.5);
  await page.evaluate(() => frappe.router.jq.trigger('change'));
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
});

test('Escape, Tab, outside click and readonly/disabled fields have no delayed reopen', async ({ page }) => {
  await page.evaluate(() => openControl());
  await page.locator('#host input').press('Escape');
  await page.waitForTimeout(250);
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
  await page.locator('#host input').click();
  await expect(page.locator('.jalali-picker')).toHaveCount(1);
  await page.locator('#host input').press('Tab');
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
  await page.evaluate(() => { control.$input.prop('readonly', true); control.show_jalali_picker(); });
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
  await page.evaluate(() => { control.$input.prop('readonly', false).prop('disabled', true); control.show_jalali_picker(); });
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
  await page.evaluate(() => { control.$input.prop('disabled', false); control.show_jalali_picker(); });
  await page.mouse.click(900, 700);
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
});

test('time-only popup remains editable and its width does not inherit date width', async ({ page }) => {
  await page.evaluate(() => openControl('Time', '12:34:56'));
  await expect(page.locator('.hour-input')).toBeEditable();
  expect((await page.evaluate(() => geometry())).width).toBe(196);
  await page.locator('.minute-input').fill('۴۵');
  await page.locator('.minute-input').press('Enter');
  await expect(page.locator('#host input')).toHaveValue('12:45:56');
  await expect(page.locator('.jalali-picker')).toHaveCount(0);
});

test('Gregorian helper matches selected day before and after Today', async ({ page }) => {
  await page.evaluate(() => {
    openControl('Date', '2026-09-24');
    control.disp_area = $('<div class="control-value"></div>').appendTo('#host')[0];
    let model = '2026-09-24';
    control.get_model_value = () => model;
    control.$input.on('change.model', () => {
      model = control.parse(control.$input.val());
      control.set_disp_area(model);
    });
    frappe.datetime.now_datetime = () => '2026-09-26 10:30:00';
    frappe.datetime.convert_to_system_tz = value => value;
  });
  for (const day of [5, 12, 20]) {
    await page.evaluate(day => {
      control.show_jalali_picker();
      control.$jalali_container.find('td[data-date="1405,7,' + day + '"]').trigger('click');
    }, day);
    await expect(page.locator('.datepicker-container')).toHaveCount(0);
    const values = await page.evaluate(day => ({
      helper: control.$stored_value.text(),
      model: control.get_model_value(),
      expected: jalali_shamsi_datepicker.core.parseJalaliInput('1405/07/' + String(day).padStart(2, '0')).gregorian,
    }), day);
    expect(values.helper).toBe(values.expected);
    expect(values.model).toBe(values.expected);
  }
  await page.evaluate(() => { control.show_jalali_picker(); control.$jalali_container.find('.pwt-btn-today').trigger('click'); });
  await expect(page.locator('.jalali-stored-value')).toHaveText('2026-09-26');
  await page.evaluate(() => { control.show_jalali_picker(); control.$jalali_container.find('td[data-date="1405,7,8"]').trigger('click'); });
  await expect(page.locator('.jalali-stored-value')).toHaveText('2026-09-30');
});
