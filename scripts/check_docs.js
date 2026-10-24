#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DOC_GLOBS = [];

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === "graphify-out" || entry.name === "dist") continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full);
		else if (entry.name.endsWith(".md") || entry.name.endsWith(".yml")) DOC_GLOBS.push(full);
	}
}

walk(ROOT);

const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
const missing = [];
const commands = [
	"npm test",
	"npm run test:unit",
	"npm run test:browser",
	"npm ci",
	"install-app jalali_shamsi_datepicker",
	"custom_enable_shamsi_jalali_calendar",
];

for (const file of DOC_GLOBS) {
	const text = fs.readFileSync(file, "utf8");
	const rel = path.relative(ROOT, file);
	let match;
	while ((match = linkRe.exec(text))) {
		const target = match[2].split("#")[0].split("?")[0];
		if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("mailto:")) continue;
		const resolved = path.resolve(path.dirname(file), target);
		if (!fs.existsSync(resolved)) missing.push(`${rel} -> ${target}`);
	}
}

const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
const readmeEn = fs.readFileSync(path.join(ROOT, "README.en.md"), "utf8");
const missingCommands = commands.filter((cmd) => !readme.includes(cmd) || !readmeEn.includes(cmd));

if (missing.length || missingCommands.length) {
	if (missing.length) {
		console.error("Broken relative links:");
		for (const item of missing) console.error("  " + item);
	}
	if (missingCommands.length) {
		console.error("Missing documented names in both README files:");
		for (const item of missingCommands) console.error("  " + item);
	}
	process.exit(1);
}

console.log(`Checked ${DOC_GLOBS.length} files. Relative links and required names are present.`);
