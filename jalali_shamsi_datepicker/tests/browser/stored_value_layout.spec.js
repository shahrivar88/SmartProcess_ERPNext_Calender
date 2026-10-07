// Layout regression for the raw Gregorian helper (.jalali-stored-value).
// The fixture reproduces the Frappe v16 control template (base_input.js make_wrapper) and
// the desk.bundle.css geometry that matters here, as measured on Frappe 16.35:
// .form-group margin-bottom 16px, 28px inputs with 6px/8px padding, 175px input-max-width,
// .help-box margin 4px 0 8px. The real jalali_controls.js / custom.css are loaded on top.
const { test, expect } = require('@playwright/test');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');

const FRAPPE_LIKE_CSS = `
  :root { --text-xs: 12px; --text-muted: #7c7c7c; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 sans-serif; }
  .hide { display: none !important; }
  .clearfix::after { content: ""; display: table; clear: both; }
  .section-body { display: flex; padding: 12px 0; }
  .form-column { flex: 0 0 50%; max-width: 50%; padding: 0 15px; }
  .form-group { margin-bottom: 16px; }
  .control-label { display: inline-block; margin-bottom: 4px; font-size: 12px; line-height: 16px; }
  .input-max-width .control-input, .input-max-width .control-value { max-width: 175px; }
  .form-control, .like-disabled-input { display: block; width: 100%; height: 28px; padding: 6px 8px;
    font-size: 14px; line-height: 16px; border: none; background: #f3f3f3; }
  .help-box { margin-top: 4px; margin-bottom: 8px; line-height: 1.6; font-size: 12px; }
  .modal-dialog { width: 600px; margin: 40px auto; }
`;

async function setup(page, { enabled = true, dir = 'ltr' } = {}) {
  await page.setContent(`<html dir="${dir}"><head><style>${FRAPPE_LIKE_CSS}</style></head>
    <body class="${enabled ? 'jalali-calendar-enabled' : ''}"><div id="root"></div></body></html>`);
  await page.addScriptTag({ path: require.resolve('jquery') });
  await page.evaluate((enabled) => {
    class ControlInput {
      constructor(opts) {
        Object.assign(this, opts);
        this.make_wrapper();
        this.set_input_areas();
        this.$input = $('<input type="text" autocomplete="off" class="input-with-feedback form-control">')
          .attr('data-fieldtype', this.df.fieldtype)
          .appendTo(this.input_area);
        if (this.make_picker) this.make_picker();
      }
      make_wrapper() {
        if (this.only_input) {
          this.$wrapper = $('<div class="form-group frappe-control">').appendTo(this.parent);
        } else {
          this.$wrapper = $(`<div class="frappe-control input-max-width">
            <div class="form-group horizontal">
              <div class="clearfix">
                <label class="control-label" style="padding-right: 5px;"></label>
                <span class="help"></span>
              </div>
              <div class="control-input-wrapper">
                <div class="control-input"></div>
                <div class="control-value like-disabled-input hide"></div>
                <div class="help-box small text-extra-muted hide"></div>
              </div>
            </div>
          </div>`).appendTo(this.parent);
          this.$wrapper.find('label').text(this.df.label || this.df.fieldname);
          if (this.df.description) this.$wrapper.find('.help-box').text(this.df.description).removeClass('hide');
        }
        this.$wrapper.attr('data-fieldtype', this.df.fieldtype).attr('data-fieldname', this.df.fieldname);
      }
      set_input_areas() {
        if (this.only_input) {
          this.input_area = this.$wrapper.get(0);
        } else {
          this.input_area = this.$wrapper.find('.control-input').get(0);
          this.disp_area = this.$wrapper.find('.control-value').get(0);
        }
      }
      set_date_options() {}
      set_t_for_today() {}
      set_time_options() {}
      format_for_input(value) { return value || ''; }
      parse(value) { return value; }
      get_model_value() { return this.value; }
      set_formatted_input(value) { this.$input.val(this.format_for_input(value)); }
      set_disp_area(value) { $(this.disp_area).text(this.format_for_input(value)); }
      // Frappe ControlData.set_input: write the input, then the display area with the model value.
      set_input(value) {
        this.value = value;
        this.set_formatted_input(value);
        this.set_disp_area(value);
      }
      set_read_only(readOnly) {
        $(this.input_area).toggleClass('hide', readOnly);
        $(this.disp_area).toggleClass('hide', !readOnly);
      }
    }
    class ControlData extends ControlInput {}
    class ControlDate extends ControlData {}
    class ControlDatetime extends ControlDate {}
    class ControlTime extends ControlData {}
    window.__ = (s) => s;
    window.frappe = {
      boot: { jalali_calendar_enabled: enabled },
      ui: { form: { ControlData, ControlDate, ControlDatetime, ControlTime } },
      form: { formatters: { Date: (v) => v, Datetime: (v) => v } },
      datetime: { user_to_str: (v) => v, str_to_user: (v) => v, now_time: () => '10:30:00' },
      router: { jq: $({}), on(event, fn) { this.jq.on(event, (e, data) => fn(data)); } },
      msgprint() {},
    };
  }, enabled);
  for (const file of ['persian-date.min.js', 'persian-datepicker.min.js', 'jalali_core.js', 'jalali_controls.js']) {
    await page.addScriptTag({ path: path.join(root, 'jalali_shamsi_datepicker/public/js', file) });
  }
  for (const file of ['persian-datepicker.min.css', 'custom.css']) {
    await page.addStyleTag({ path: path.join(root, 'jalali_shamsi_datepicker/public/css', file) });
  }
  await page.evaluate(() => {
    // Two columns: [target, next] and [reference Data, next]. Same description/read-only mode
    // on both sides, so any extra height from the helper shows up as a Y difference.
    window.buildForm = ({ fieldtype = 'Date', value, readOnly = false, description = '', modal = false, onlyInput = false } = {}) => {
      const shell = modal
        ? '<div class="modal"><div class="modal-dialog"><div class="modal-content"><div class="modal-body"><div class="section-body"></div></div></div></div></div>'
        : '<div class="form-layout"><div class="form-page"><div class="form-section card-section"><div class="section-body"></div></div></div></div>';
      const $root = $('#root').empty().append(shell);
      const $body = $root.find('.section-body');
      const column = () => $('<div class="form-column"><form></form></div>').appendTo($body).find('form');
      const left = column();
      const right = column();
      const make = (type, parent, df, only_input = false) =>
        new frappe.ui.form['Control' + type]({ parent, only_input, df: { fieldtype: type, ...df } });
      window.target = make(fieldtype, left, { fieldname: 'target', description }, onlyInput);
      window.next = make('Data', left, { fieldname: 'next' });
      window.reference = make('Data', right, { fieldname: 'reference', description }, onlyInput);
      window.refNext = make('Data', right, { fieldname: 'ref_next' });
      for (const control of [target, next, reference, refNext]) {
        control.set_input(control === target ? value : 'text');
        if (readOnly && control.set_read_only && !control.only_input) control.set_read_only(control === target || control === reference);
      }
    };
    window.measure = () => {
      const rect = (el) => el.getBoundingClientRect();
      const helperEl = target.$wrapper.find('.jalali-stored-value').get(0);
      const visibleBox =
        target.$wrapper.find('.control-input:not(.hide) input, .control-value:not(.hide)').get(0) || target.$input.get(0);
      const boxStyle = getComputedStyle(visibleBox);
      const helpBox = target.$wrapper.find('.help-box:not(.hide)').get(0);
      const host = target.$wrapper.find('.control-input-wrapper').get(0) || target.$wrapper.get(0);
      const ch = (() => {
        const probe = $('<span style="position:absolute;width:1ch"></span>')
          .css('font-size', helperEl ? getComputedStyle(helperEl).fontSize : '12px').appendTo('body');
        const width = probe.get(0).getBoundingClientRect().width;
        probe.remove();
        return width;
      })();
      return {
        helperCount: target.$wrapper.find('.jalali-stored-value').length,
        helper: helperEl && $(helperEl).is(':visible') ? rect(helperEl).toJSON() : null,
        helperText: helperEl ? helperEl.textContent : null,
        hostClass: host.classList.contains('jalali-stored-value-host'),
        bodyEnabled: document.body.classList.contains('jalali-calendar-enabled'),
        box: rect(visibleBox).toJSON(),
        boxPaddingRight: parseFloat(boxStyle.paddingRight),
        host: rect(host).toJSON(),
        helpBoxBottom: helpBox ? rect(helpBox).bottom : null,
        targetHeight: rect(target.$wrapper.get(0)).height,
        referenceHeight: rect(reference.$wrapper.get(0)).height,
        targetBoxOffset: rect(visibleBox).top - rect(target.$wrapper.get(0)).top,
        nextLabelTop: rect(next.$wrapper.find('label').get(0)).top,
        refNextLabelTop: rect(refNext.$wrapper.find('label').get(0)).top,
        nextTop: rect(next.$wrapper.get(0)).top,
        refNextTop: rect(refNext.$wrapper.get(0)).top,
        ch,
        targetInput: target.$input.val(),
        model: target.get_model_value(),
      };
    };
  });
}

const scenarios = [];
for (const dir of ['ltr', 'rtl']) {
  for (const [fieldtype, value] of [['Date', '2026-09-25'], ['Datetime', '2026-09-25 14:30:05']]) {
    for (const readOnly of [false, true]) {
      for (const description of ['', 'Field description']) {
        for (const modal of [false, true]) scenarios.push({ dir, fieldtype, value, readOnly, description, modal });
      }
    }
  }
}

for (const s of scenarios) {
  const name = `${s.dir} ${s.fieldtype} ${s.readOnly ? 'read-only' : 'editable'}${s.description ? ' +description' : ''}${s.modal ? ' in dialog' : ''}`;
  test(`helper adds no layout height, stays visible, does not overlap (${name})`, async ({ page }) => {
    await setup(page, { dir: s.dir });
    await page.evaluate((s) => buildForm(s), s);
    const m = await page.evaluate(() => measure());

    expect(m.helperCount).toBe(1);
    expect(m.helper, 'helper must stay visible').not.toBeNull();
    expect(m.helperText).toBe(s.value);
    expect(m.helper.height).toBeGreaterThan(8);
    // Zero extra vertical space: the next field sits exactly where it sits next to a plain control.
    expect(Math.abs(m.targetHeight - m.referenceHeight)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.nextTop - m.refNextTop)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(m.nextLabelTop - m.refNextLabelTop)).toBeLessThanOrEqual(0.5);
    // Below the input/value box and the description, above the next field's label.
    expect(m.helper.top).toBeGreaterThanOrEqual(m.box.bottom - 0.5);
    if (m.helpBoxBottom !== null) expect(m.helper.top).toBeGreaterThanOrEqual(m.helpBoxBottom - 0.5);
    expect(m.helper.bottom).toBeLessThanOrEqual(m.nextLabelTop + 0.5);
    // Horizontal alignment.
    if (s.dir === 'rtl') {
      const shift = m.host.right - m.helper.right;
      expect(shift).toBeGreaterThanOrEqual(m.ch * 1.0 - 0.5);
      expect(shift).toBeLessThanOrEqual(m.ch * 2.0 + 0.5);
      expect(Math.abs(m.helper.right - (m.box.right - m.boxPaddingRight))).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(m.helper.left - m.host.left)).toBeLessThanOrEqual(0.5);
    }
    expect(m.helper.left).toBeGreaterThanOrEqual(m.host.left - 0.5);
    expect(m.helper.right).toBeLessThanOrEqual(m.host.right + 0.5);
  });
}

for (const dir of ['ltr', 'rtl']) {
  test(`helper does not move or resize the input; one helper after repeated refresh (${dir})`, async ({ page }) => {
    await setup(page, { dir });
    const result = await page.evaluate(() => {
      buildForm({ fieldtype: 'Date', value: '' });
      const before = measure();
      for (const v of ['2026-09-25', '2026-10-06', '2026-10-06']) target.set_input(v);
      return { before, after: measure() };
    });
    expect(result.before.helper, 'empty value hides the helper').toBeNull();
    expect(result.after.helperCount).toBe(1);
    expect(result.after.helperText).toBe('2026-10-06');
    for (const key of ['left', 'right', 'width', 'height']) {
      expect(result.after.box[key]).toBeCloseTo(result.before.box[key], 1);
    }
    expect(result.after.targetBoxOffset).toBeCloseTo(result.before.targetBoxOffset, 1);
    expect(result.after.nextTop).toBeCloseTo(result.before.nextTop, 1);
  });
}

test('compact Jalali entry stores Gregorian and the helper shows the stored value', async ({ page }) => {
  await setup(page, { dir: 'rtl' });
  const steps = await page.evaluate(() => {
    buildForm({ fieldtype: 'Date', value: '2026-09-24' });
    target.$input.on('change.model', () => target.set_input(target.parse(target.$input.val())));
    const out = [];
    for (const typed of ['14050703', '۱۴۰۵۰۷۰۳', '١٤٠٥٠٧٠٣', '1405/07/03', '1405-7-3', '2026-09-25', '2026/09/25']) {
      target.set_input('2026-09-24');
      target.$input.val(typed).trigger('change');
      out.push({ typed, ...measure() });
    }
    return out;
  });
  for (const step of steps) {
    expect(step.model, step.typed).toBe('2026-09-25');
    expect(step.helperText, step.typed).toBe('2026-09-25');
    expect(step.targetInput, step.typed).toBe('1405/07/03');
    expect(Math.abs(step.nextTop - step.refNextTop)).toBeLessThanOrEqual(0.5);
  }
});

test('grid cells and list/report filters (only_input) get no helper and keep their layout', async ({ page }) => {
  await setup(page);
  const m = await page.evaluate(() => {
    buildForm({ fieldtype: 'Date', value: '2026-09-25', onlyInput: true });
    return measure();
  });
  expect(m.helperCount).toBe(0);
  expect(m.hostClass).toBe(false);
  expect(Math.abs(m.nextTop - m.refNextTop)).toBeLessThanOrEqual(0.5);
});

test('Jalali disabled: standard controls, no helper, no app classes, standard layout', async ({ page }) => {
  await setup(page, { enabled: false });
  await page.waitForTimeout(20);
  const m = await page.evaluate(() => {
    buildForm({ fieldtype: 'Date', value: '2026-09-25' });
    return { ...measure(), patched: !!window.jalali_shamsi_datepicker.controls_installed };
  });
  expect(m.patched).toBe(false);
  expect(m.bodyEnabled).toBe(false);
  expect(m.helperCount).toBe(0);
  expect(m.hostClass).toBe(false);
  expect(m.targetInput).toBe('2026-09-25');
  expect(m.model).toBe('2026-09-25');
  expect(Math.abs(m.nextTop - m.refNextTop)).toBeLessThanOrEqual(0.5);
  expect(await page.locator('.jalali-picker').count()).toBe(0);
});
