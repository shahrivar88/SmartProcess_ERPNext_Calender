app_name = "jalali_shamsi_datepicker"
app_title = "Jalali Shamsi Datepicker"
app_icon = "octicon octicon-calendar"
app_color = "blue"
app_publisher = "Ideenemium"
app_description = "A best solution to change date and datetime fields to Shamsi(Jalali) Calendar."
app_email = "ideenemium@gmail.com"
app_license = "MIT"
required_apps = ["frappe"]

# Only this app's own Custom Field; never widen this filter.
fixtures = [
    {
        "doctype": "Custom Field",
        "filters": [
            ["dt", "=", "System Settings"],
            ["fieldname", "=", "custom_enable_shamsi_jalali_calendar"],
        ],
    }
]

extend_bootinfo = ["jalali_shamsi_datepicker.boot.extend_bootinfo"]
before_uninstall = "jalali_shamsi_datepicker.uninstall.before_uninstall"

app_include_css = [
    "/assets/jalali_shamsi_datepicker/css/persian-datepicker.min.css",
    "/assets/jalali_shamsi_datepicker/css/custom.css?v=17",
]
app_include_js = [
    "/assets/jalali_shamsi_datepicker/js/persian-date.min.js",
    "/assets/jalali_shamsi_datepicker/js/persian-datepicker.min.js?v=3",
    "/assets/jalali_shamsi_datepicker/js/jalali_core.js?v=3",
    "/assets/jalali_shamsi_datepicker/js/jalali_controls.js?v=16",
]
