import frappe

# Custom Fields created by this app (current and deprecated). Nothing else is removed:
# Date/Datetime values in business documents are standard Gregorian and stay untouched.
APP_CUSTOM_FIELDS = (
	("System Settings", "custom_enable_shamsi_jalali_calendar"),
	("System Settings", "custom_date_storage_format"),
)


# Only called from `bench uninstall-app` (before_uninstall) and `bench migrate` (patch); both
# run as Administrator via frappe.connect(), which delete_doc and CustomField.on_trash require.
def delete_app_custom_fields(fields=APP_CUSTOM_FIELDS):
	for dt, fieldname in fields:
		for name in frappe.get_all("Custom Field", filters={"dt": dt, "fieldname": fieldname}, pluck="name"):
			frappe.delete_doc("Custom Field", name, force=True)


def before_uninstall():
	delete_app_custom_fields()
	frappe.clear_cache()
