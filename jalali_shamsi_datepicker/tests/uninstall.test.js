// Runs the real uninstall hook and migration patch under Python with a recording stub of
// `frappe`, so we can see every Frappe call they make. Kept out of Python test discovery on
// purpose: a stub `frappe` module must never replace the real one inside `bench run-tests`.
// Run: node --test jalali_shamsi_datepicker/tests/uninstall.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..", "..");
const PYTHON = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const hasPython = spawnSync(PYTHON, ["--version"]).status === 0;

const SCRIPT = `
import json, sys, types
sys.path.insert(0, sys.argv[1])
calls = []
frappe = types.ModuleType("frappe")
def get_all(doctype, filters=None, pluck=None, **kwargs):
    calls.append({"api": "get_all", "doctype": doctype, "filters": filters, "pluck": pluck, "kwargs": kwargs})
    return ["CF-" + filters["fieldname"]]
def delete_doc(*args, **kwargs):
    calls.append({"api": "delete_doc", "args": list(args), "kwargs": kwargs})
def clear_cache(**kwargs):
    calls.append({"api": "clear_cache", "kwargs": kwargs})
frappe.get_all = get_all
frappe.delete_doc = delete_doc
frappe.clear_cache = clear_cache
sys.modules["frappe"] = frappe
from jalali_shamsi_datepicker import uninstall
from jalali_shamsi_datepicker.patches import remove_date_storage_format
uninstall.before_uninstall()
uninstall_calls, calls[:] = list(calls), []
remove_date_storage_format.execute()
print(json.dumps({"uninstall": uninstall_calls, "patch": calls}))
`;

function run() {
	const result = spawnSync(PYTHON, ["-B", "-c", SCRIPT, ROOT], {
		encoding: "utf8",
		env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
	});
	assert.equal(result.status, 0, result.stderr);
	return JSON.parse(result.stdout);
}

const APP_FIELDS = ["custom_enable_shamsi_jalali_calendar", "custom_date_storage_format"];

function assertOnlyAppCustomFields(calls, expectedFields) {
	const reads = calls.filter((c) => c.api === "get_all");
	const deletes = calls.filter((c) => c.api === "delete_doc");
	assert.deepEqual(
		reads.map((c) => [c.doctype, c.filters, c.pluck]),
		expectedFields.map((f) => ["Custom Field", { dt: "System Settings", fieldname: f }, "name"])
	);
	assert.deepEqual(
		deletes.map((c) => c.args),
		expectedFields.map((f) => ["Custom Field", "CF-" + f])
	);
	for (const c of deletes) {
		assert.deepEqual(c.kwargs, { force: true }, "no permission bypass, no other flags");
	}
	// Any other frappe API (frappe.db, sql, set_value, ...) would raise AttributeError in the stub.
	assert.ok(calls.every((c) => ["get_all", "delete_doc", "clear_cache"].includes(c.api)));
}

test("before_uninstall deletes only this app's two Custom Fields, without ignore_permissions", { skip: !hasPython && "python not found" }, () => {
	const { uninstall } = run();
	assertOnlyAppCustomFields(uninstall, APP_FIELDS);
	assert.equal(uninstall.at(-1).api, "clear_cache");
});

test("migration patch deletes only the deprecated storage-format field", { skip: !hasPython && "python not found" }, () => {
	const { patch } = run();
	assertOnlyAppCustomFields(patch, ["custom_date_storage_format"]);
});
