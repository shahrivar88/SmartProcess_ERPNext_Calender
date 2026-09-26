// Jalali display/input layer for Frappe v16 Date, Datetime and Time controls.
//
// The model value is never touched: Frappe keeps "YYYY-MM-DD" / "YYYY-MM-DD HH:mm:ss"
// / "HH:mm:ss" (system time zone). Only the text shown in the input and in
// read-only/list formatters is Jalali, and Jalali text typed or picked by the user
// is converted back to Frappe's own user-format string before the original parse()
// runs, so time zone conversion, date expressions (+1d) and validation stay exactly
// as in Frappe.
//
// Version-sensitive (checked against Frappe 16.34):
//   - frappe.ui.form.make_control resolves frappe.ui.form["Control" + fieldtype] at call time.
//   - ControlDate.set_formatted_input / ControlDatetime.set_formatted_input return early
//     when this.datepicker is not set.
//   - ControlDatetime.format_for_input returns "<user date> <user time>" in the user time zone.
//   - frappe.form.formatters.Date / Datetime return the same user-format strings.
//   - ControlData.set_input(value) calls set_disp_area(value) with the model value, and
//     disp_area is the ".control-value" element (absent when only_input).
//   - ControlTime normally uses air-datepicker onlyTimepicker; we replace it with
//     persian-datepicker onlyTimePicker when Jalali is enabled.
(function () {
	const ns = (window.jalali_shamsi_datepicker = window.jalali_shamsi_datepicker || {});
	const core = ns.core;

	if (ns.controls_installed) return;
	if (!(frappe.boot && frappe.boot.jalali_calendar_enabled)) return;
	if (!core || !frappe.ui.form.ControlDate || !frappe.ui.form.ControlDatetime) return;
	ns.controls_installed = true;

	const DATE_FMT = "YYYY/MM/DD";
	const DATETIME_FMT = "YYYY/MM/DD HH:mm:ss";
	const TIME_FMT = "HH:mm:ss";
	let pickerSequence = 0;

	// "<user date>[ <time>]" (Frappe user format) -> "<jalali date>[ <time>]"; unchanged if unparsable.
	function userToJalaliText(text) {
		if (!text) return text;
		const space = text.indexOf(" ");
		const datePart = space === -1 ? text : text.slice(0, space);
		const timePart = space === -1 ? "" : text.slice(space);
		const jalali = core.gregorianToJalaliString(frappe.datetime.user_to_str(datePart));
		return jalali ? jalali + timePart : text;
	}

	function pad(n) {
		return String(n).padStart(2, "0");
	}

	function clampInt(value, min, max) {
		const n = parseInt(core.normalizeDigits(String(value || "")), 10);
		if (Number.isNaN(n)) return null;
		return Math.min(max, Math.max(min, n));
	}

	function withJalali(Base, mode) {
		const isDatetime = mode === "datetime";
		const isTime = mode === "time";
		return class extends Base {
			make_picker() {
				// Frappe's air-datepicker is replaced by a Persian picker created on demand.
				if (isTime) {
					this.set_time_options && this.set_time_options();
				} else {
					this.set_date_options();
					this.set_t_for_today();
				}
				if (!this.df.placeholder) {
					this.$input.attr(
						"placeholder",
						isTime ? TIME_FMT : isDatetime ? DATETIME_FMT : DATE_FMT
					);
				}
				this.$input.off(".jalali").on("focus.jalali click.jalali", () => this.show_jalali_picker());
			}

			set_formatted_input(value) {
				if (!isDatetime && !isTime) {
					super.set_formatted_input(value);
					return;
				}
				// ControlDatetime/Time.set_formatted_input only write the input when air-datepicker exists.
				if (typeof value === "string" && ["today", "now"].includes(value.toLowerCase())) {
					value = isTime ? frappe.datetime.now_time() : frappe.datetime.now_datetime();
				}
				this.$input && this.$input.val(this.format_for_input(value));
			}

			format_for_input(value) {
				if (isTime) return super.format_for_input(value);
				return userToJalaliText(super.format_for_input(value));
			}

			set_disp_area(value) {
				super.set_disp_area(value);
				if (!isTime) this.show_stored_value(value);
			}

			// Shows the raw model value (what is saved to the database) under the field.
			// Skipped for only_input controls (grid cells, list/report filters).
			show_stored_value(value) {
				if (this.only_input || !this.disp_area) return;
				if (!this.$stored_value) {
					this.$stored_value = $('<div class="jalali-stored-value"><bdi dir="ltr"></bdi></div>')
						.attr("title", __("Value saved to the database"))
						.insertAfter(this.disp_area);
				}
				const raw = value === undefined || value === null ? "" : String(value);
				this.$stored_value.find("bdi").text(raw);
				this.$stored_value.toggleClass("hide", !raw);
			}

			parse(value) {
				if (isTime) return super.parse(value);
				const parsed = core.parseJalaliInput(value);
				if (!parsed) {
					// Not Jalali-shaped: keep Gregorian input (with any digit system) working
					// exactly like Frappe's own parse, and leave everything else untouched.
					const iso = core.normalizeGregorianInput(value);
					if (iso) {
						const [datePart, timePart] = iso.split(" ");
						const userText =
							frappe.datetime.str_to_user(datePart, false, true) +
							(!isDatetime || !timePart ? "" : " " + timePart);
						return super.parse(userText);
					}
					return super.parse(value);
				}
				if (!parsed.valid) {
					const current = this.get_model_value();
					frappe.msgprint({
						title: __("Invalid Date"),
						indicator: "red",
						// parsed.input is user text and can contain markup (e.g. in the time part);
						// msgprint appends message as HTML, so escape it before interpolating.
						message: __("{0} is not a valid Jalali date.", [core.escapeHtml(parsed.input)]),
					});
					setTimeout(() => this.set_formatted_input(current), 0);
					return current;
				}
				let userText = frappe.datetime.str_to_user(parsed.gregorian, false, true);
				if (isDatetime && parsed.time) {
					userText += " " + parsed.time;
				}
				return super.parse(userText);
			}

			// options for persian-datepicker that mirror Frappe's own df.min_date /
			// df.max_date / df.disabled_dates. The boundaries are derived from the
			// Gregorian model (database stays Gregorian); the picker renders Jalali.
			// Selections are still re-validated against the core converter before commit.
			build_jalali_date_options() {
				const df = this.df || {};
				const opts = {};
				if (df.min_date) {
					const ts = core.gregorianDateStringToTimestamp(df.min_date);
					if (ts != null) opts.minDate = ts;
				}
				if (df.max_date) {
					const ts = core.gregorianDateStringToTimestamp(df.max_date);
					if (ts != null) opts.maxDate = ts;
				}
				const disabled = core.disabledDatesSet(df.disabled_dates);
				if (disabled) {
					opts.checkDate = function (ts) {
						return !disabled.has(core.timestampToGregorianDateString(ts));
					};
				}
				return opts;
			}

			show_jalali_picker() {
				if (this.jalali_picker || !this.$input || this.$input.prop("readonly") || this.$input.prop("disabled")) return;

				const initial = isTime
					? null
					: core.parseJalaliInput(this.$input.val());
				// Snapshot the model text so an outside click can close without changing the value.
				this._jalali_open_value = this.format_for_input(this.get_model_value());
				// autoClose fires onHide before onSelect, so onHide uses this local reference.
				const picker = this.$input.persianDatepicker({
					format: isTime ? TIME_FMT : isDatetime ? DATETIME_FMT : DATE_FMT,
					initialValue: false,
					observer: false,
					managedInput: true,
					responsive: false,
					autoClose: !isDatetime && !isTime,
					persianDigit: false,
					position: "auto",
					onlyTimePicker: isTime,
					calendar: { persian: { locale: "fa", leapYearMode: "astronomical" } },
					timePicker: {
						enabled: isDatetime || isTime,
						second: { enabled: true },
						meridian: { enabled: false },
					},
					toolbox: {
						calendarSwitch: { enabled: false },
						todayButton: {
							enabled: true,
							onToday: () => this.select_jalali_today(picker),
						},
						submitButton: {
							enabled: isTime,
							onSubmit: () => {
								this.apply_time_from_state(picker);
								picker.hide();
							},
						},
					},
					onSelect: () => this.apply_jalali_selection(),
					onHide: () => this.destroy_jalali_picker(picker),
					...this.build_jalali_date_options(),
				});
				this.jalali_picker = picker;
				this._jalali_ns = ".jalaliPicker" + (++pickerSequence);
				this.install_jalali_view(picker);
				// Datetime / Time pickers stay open until an outside click; close them when
				// the dialog or page goes away programmatically.
				const close = () => this.destroy_jalali_picker(picker);
				this._jalali_close = close;
				this._jalali_modal = this.$input.closest(".modal");
				this._jalali_modal.on("hide.bs.modal" + this._jalali_ns, close);
				frappe.router.on("change" + this._jalali_ns, close);
				// Frappe's emitter wraps callbacks; removing by handler cannot match it.
				this._jalali_router_events = frappe.router.jq;
				this._jalali_detach_observer = new MutationObserver(() => {
					if (!this.$input.get(0).isConnected) close();
				});
				this._jalali_detach_observer.observe(document.body, { childList: true, subtree: true });
				this.bind_jalali_positioning(picker);
				this.bind_jalali_outside_close(picker);
				this.bind_jalali_keys(picker);

				if (isTime) {
					this.sync_time_picker(picker);
				} else if (initial && initial.valid) {
					const [gy, gm, gd] = initial.gregorian.split("-").map(Number);
					const [h, mi, s] = (initial.time || "0:0:0").split(":").map(Number);
					this._jalali_syncing = true;
					picker.setDate(new Date(gy, gm - 1, gd, h || 0, mi || 0, s || 0).getTime());
					this._jalali_syncing = false;
					this.$input.val(this.format_for_input(this.get_model_value()));
				}
				picker.show();
			}

			// Instance-local adapter for the bundled persian-datepicker 1.2.0.
			// Trim the view model BEFORE templating; every render path (including wheel,
			// month/year and setDate) now creates exactly the required rows.
			install_jalali_view(picker) {
				const view = picker.model.view;
				this.$jalali_container = view.$container.addClass("jalali-picker");
				const dayModel = view._getDayViewModel.bind(view);
				view._getDayViewModel = () => {
					const days = dayModel();
					if (days.list) {
						while (days.list.length > 5 && days.list.at(-1).every(day => day.otherMonth)) {
							days.list.pop();
						}
					}
					return days;
				};
				// Replace the library's positioning writer, including subsequent show calls.
				view.setPickerBoxPosition = () => {
					if (this.jalali_picker === picker) this.reposition_jalali_picker();
				};
				const afterRender = view.afterRender.bind(view);
				view.afterRender = () => {
					afterRender();
					if (this.jalali_picker !== picker) return;
					this.enable_time_keyboard(picker);
					this.reposition_jalali_picker();
				};
				for (const action of ["timeUp", "timeDown"]) {
					const spin = picker.model.navigator[action].bind(picker.model.navigator);
					picker.model.navigator[action] = (key) => {
						spin(key);
						this.apply_time_from_state(picker);
					};
				}
				view.render(); // Initial constructor render is still hidden.
			}

			bind_jalali_outside_close(picker) {
				const ns = this._jalali_ns;
				this._jalali_outside_ns = ns;
				$(document).on("mousedown" + ns, (e) => {
					if (this.jalali_picker !== picker) return;
					if (this.$jalali_container.get(0).contains(e.target) || this.$input.is(e.target)) return;
					picker.hide();
				});
			}

			bind_jalali_keys(picker) {
				const ns = this._jalali_ns;
				this._jalali_keys_ns = ns;
				this.$input.off(ns).on("keydown" + ns, (e) => {
					if (this.jalali_picker !== picker) return;
					if (e.key === "Escape") {
						// Cancel: restore the value the field had when the picker opened.
						e.preventDefault();
						e.stopPropagation();
						this.$input.val(
							this._jalali_open_value != null
								? this._jalali_open_value
								: this.format_for_input(this.get_model_value())
						);
						picker.hide();
					} else if (e.key === "Tab") {
						// Commit as typed and let Frappe move focus naturally.
						picker.hide();
					} else if (e.key === "Enter") {
						e.preventDefault();
						this.$input.val(core.normalizeDigits(this.$input.val())).trigger("change");
						picker.hide();
					}
				});
			}

			bind_jalali_positioning(picker) {
				const posNs = this._jalali_ns;
				const onMove = () => {
					if (this.jalali_picker === picker) this.reposition_jalali_picker();
				};
				$(window).off(posNs).on("resize" + posNs + " scroll" + posNs, onMove);
				// Desk scrolls inside nested containers, not only window.
				const $scrollers = this.$input
					.parents()
					.add(document)
					.filter(function () {
						if (this === document) return true;
						const style = window.getComputedStyle(this);
						return /(auto|scroll|overlay)/.test(style.overflowX + " " + style.overflowY);
					});
				$scrollers.off(posNs).on("scroll" + posNs, onMove);
				this._jalali_pos_ns = posNs;
				this._jalali_scrollers = $scrollers;
			}

			reposition_jalali_picker() {
				if (!this.$input || !this.$input.length) return;
				const $cont = this.$jalali_container;
				if (!$cont || !$cont.length || $cont.hasClass("pwt-hide")) return;
				const $plot = $cont.find(".datepicker-plot-area");
				// Relative plot so the container gets a real width/height for centering.
				$plot.css({ position: "relative", left: "0", top: "0" });
				// Fixed to the viewport so the sheet tracks the field while the desk scrolls.
				// Outside dialogs keep a low z-index so the sticky .page-head (z-index 6)
				// still covers the sheet when the field scrolls under it; inside a modal or
				// Quick Entry the modal backdrop (z-index ~1040/1050) would hide the sheet,
				// so raise it above the modal element itself.
				let zIndex = 5;
				const $modal = this.$input.closest(".modal");
				if ($modal.length) {
					const modalZ = parseInt(window.getComputedStyle($modal.get(0)).zIndex, 10);
					zIndex = (Number.isFinite(modalZ) ? modalZ : 1050) + 10;
				}
				$cont.css({ position: "fixed", margin: 0, zIndex });
				const input = this.$input.get(0);
				if (!input.isConnected || !input.getClientRects().length) {
					this.jalali_picker.hide();
					return;
				}
				const rect = input.getBoundingClientRect();
				const height = $plot.outerHeight() || 0;
				const width = $plot.outerWidth() || 228;
				const pageHead = document.querySelector(".page-head");
				const chromeBottom = !$modal.length && pageHead ? pageHead.getBoundingClientRect().bottom : 0;
				// Field scrolled under the page head — close instead of drawing over menus.
				if (rect.bottom <= chromeBottom + 2) {
					if (this.jalali_picker) this.jalali_picker.hide();
					return;
				}
				let top = rect.bottom + 4;
				const fitsBelow = rect.bottom + height + 8 <= window.innerHeight;
				const fitsAbove = rect.top - height - 4 >= Math.max(8, chromeBottom + 4);
				if (!fitsBelow && fitsAbove) {
					top = rect.top - height - 4;
				}
				top = Math.max(chromeBottom + 4, Math.min(top, window.innerHeight - height - 8));
				// Center on the field (middle-to-middle).
				let left = rect.left + (rect.width - width) / 2;
				if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
				if (left < 8) left = 8;
				$cont.css({ top: Math.round(top) + "px", left: Math.round(left) + "px" });
			}

			sync_time_picker(picker) {
				const raw = this.get_model_value() || this.$input.val() || frappe.datetime.now_time();
				const parts = core.normalizeDigits(String(raw)).match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
				if (!parts) return;
				const now = new Date();
				this._jalali_syncing = true;
				picker.setDate(
					new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate(),
						Number(parts[1]) || 0,
						Number(parts[2]) || 0,
						Number(parts[3]) || 0
					).getTime()
				);
				this._jalali_syncing = false;
				this.$input.val(this.format_for_input(this.get_model_value() || raw));
			}

			// Library "Today" only updates the view; it does not fire onSelect or close.
			select_jalali_today(picker) {
				if (isTime) {
					const nowTime = frappe.datetime.now_time();
					this.$input.val(nowTime).trigger("change");
					picker.hide();
					return;
				}
				// now_datetime() is already in the *user* time zone, and format_for_input()
				// also converts system -> user, so converting to the system zone here avoids
				// applying the user offset twice (Frappe stores datetimes in the system zone).
				const systemNow = frappe.datetime.convert_to_system_tz(frappe.datetime.now_datetime());
				const model = isDatetime ? systemNow : systemNow.slice(0, 10);
				const text = this.format_for_input(model);
				this.$input.val(text).trigger("change");
				picker.hide();
			}

			apply_jalali_selection() {
				if (this._jalali_syncing) return;
				// Day clicks: the picker already wrote Jalali text into the input (with time kept).
				// Do not use getState().selected after a day click — it reports 12:00:00.
				this.$input.val(core.normalizeDigits(this.$input.val())).trigger("change");
				this._jalali_open_value = this.$input.val();
			}

			// Time spins / keyboard: library updates state but not the host input — write it ourselves.
			apply_time_from_state(picker) {
				if (this._jalali_syncing || !picker) return;
				const s = picker.getState().selected;
				const time = pad(s.hour) + ":" + pad(s.minute) + ":" + pad(s.second);
				if (isTime) {
					this.$input.val(time).trigger("change");
					return;
				}
				const date = s.year + "/" + pad(s.month) + "/" + pad(s.date);
				this.$input.val(date + " " + time).trigger("change");
			}

			// Prefer the host field's current value (keeps date + other time parts) over library state.
			apply_typed_time_part(key, n) {
				const raw = core.normalizeDigits(this.$input.val() || "");
				if (isTime) {
					const m = raw.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
					let h = m ? Number(m[1]) : 0;
					let mi = m ? Number(m[2]) : 0;
					let s = m && m[3] != null ? Number(m[3]) : 0;
					if (key === "hour") h = n;
					else if (key === "minute") mi = n;
					else s = n;
					this.$input.val(pad(h) + ":" + pad(mi) + ":" + pad(s)).trigger("change");
					return;
				}
				const jalaliDate = raw.split(/\s+/)[0] || "";
				const parsed = core.parseJalaliInput(raw);
				const tm = (parsed && parsed.valid && parsed.time ? parsed.time : "00:00:00").split(":");
				let h = Number(tm[0]) || 0;
				let mi = Number(tm[1]) || 0;
				let s = Number(tm[2]) || 0;
				if (key === "hour") h = n;
				else if (key === "minute") mi = n;
				else s = n;
				this.$input.val(jalaliDate + " " + pad(h) + ":" + pad(mi) + ":" + pad(s)).trigger("change");
			}

			enable_time_keyboard(picker) {
				if (!(isDatetime || isTime) || this.jalali_picker !== picker) return;
				const $root = this.$jalali_container;
				const inputs = $root.find(".hour-input, .minute-input, .second-input");
				if (!inputs.length) return;

				inputs
					.prop("disabled", false)
					.prop("readonly", false)
					.attr("inputmode", "numeric")
					.attr("autocomplete", "off");

				// Sync visible time boxes from the host field (library hour-input can show a wrong digit).
				const host = core.normalizeDigits(this.$input.val() || "");
				const tm = (isTime ? host : (host.split(/\s+/)[1] || "")).match(
					/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/
				);
				if (tm) {
					$root.find(".hour-input").val(pad(Number(tm[1]) || 0));
					$root.find(".minute-input").val(pad(Number(tm[2]) || 0));
					$root.find(".second-input").val(pad(Number(tm[3]) || 0));
				}

				inputs.off(".jalaliTime").on("focus.jalaliTime", function () {
					this.select();
				});

				inputs.on("keydown.jalaliTime", (e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						$(e.target).trigger("change");
						$(e.target).blur();
						if (isTime) picker.hide();
					}
				});

				inputs.on("change.jalaliTime", (e) => {
					const $el = $(e.target);
					const key = $el.hasClass("hour-input")
						? "hour"
						: $el.hasClass("minute-input")
							? "minute"
							: "second";
					const max = key === "hour" ? 23 : 59;
					const n = clampInt($el.val(), 0, max);
					if (n === null) {
						this.enable_time_keyboard(picker);
						return;
					}
					$el.val(pad(n));
					this.apply_typed_time_part(key, n);
					// Keep subsequent spin/wheel operations based on the newly typed time.
					const text = core.normalizeDigits(this.$input.val());
					const parsed = isTime ? null : core.parseJalaliInput(text);
					if (isTime || (parsed && parsed.valid)) {
						const date = isTime ? new Date() : new Date(parsed.gregorian + "T00:00:00");
						const [h, m, s] = (isTime ? text : parsed.time).split(":").map(Number);
						date.setHours(h, m, s || 0, 0);
						this._jalali_syncing = true;
						try { picker.setDate(date.getTime()); }
						finally {
							this._jalali_syncing = false;
							this.$input.val(text);
						}
					}
				});
			}

			destroy_jalali_picker(picker) {
				if (this.jalali_picker !== picker || picker._jalali_destroyed) return;
				this.jalali_picker = null;
				this._jalali_modal.off(this._jalali_ns);
				this._jalali_router_events.off(this._jalali_ns);
				this._jalali_detach_observer.disconnect();
				picker.model.view.hide();
				if (this._jalali_pos_ns) {
					$(window).off(this._jalali_pos_ns);
					if (this._jalali_scrollers) this._jalali_scrollers.off(this._jalali_pos_ns);
				}
				if (this._jalali_outside_ns) $(document).off(this._jalali_outside_ns);
				if (this._jalali_keys_ns) {
					this.$input.off(this._jalali_keys_ns);
					this._jalali_keys_ns = null;
				}
				this._jalali_open_value = null;
				this.$jalali_container = null;
				picker._jalali_destroyed = true;
				setTimeout(() => picker.destroy(), 0);
			}
		};
	}

	frappe.ui.form.ControlDate = withJalali(frappe.ui.form.ControlDate, "date");
	frappe.ui.form.ControlDatetime = withJalali(frappe.ui.form.ControlDatetime, "datetime");
	if (frappe.ui.form.ControlTime) {
		frappe.ui.form.ControlTime = withJalali(frappe.ui.form.ControlTime, "time");
	}

	const formatDate = frappe.form.formatters.Date;
	const formatDatetime = frappe.form.formatters.Datetime;
	frappe.form.formatters.Date = function (value, ...args) {
		return userToJalaliText(formatDate.call(this, value, ...args));
	};
	frappe.form.formatters.Datetime = function (value, ...args) {
		return userToJalaliText(formatDatetime.call(this, value, ...args));
	};

	$(() => $("body").addClass("jalali-calendar-enabled"));
})();
