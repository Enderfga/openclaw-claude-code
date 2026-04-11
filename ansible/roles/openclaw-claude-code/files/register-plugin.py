#!/usr/bin/env python3
"""Register openclaw-claude-code plugin in openclaw.json (idempotent).

Usage: register-plugin.py <config_path> <plugin_name> <plugin_path>

Ensures:
  - plugins.load.paths contains <plugin_path>
  - plugins.entries.<plugin_name>.enabled = true

Prints "ok" if already configured, "changed" if modified.
"""
import json
import sys

config_path = sys.argv[1]
plugin_name = sys.argv[2]
plugin_path = sys.argv[3]

with open(config_path) as f:
    c = json.load(f)

changed = False

# Ensure plugins.load.paths contains the plugin path
load = c.setdefault("plugins", {}).setdefault("load", {})
paths = load.setdefault("paths", [])
if plugin_path not in paths:
    paths.append(plugin_path)
    changed = True

# Ensure plugins.entries.<name>.enabled = true
entries = c["plugins"].setdefault("entries", {})
entry = entries.setdefault(plugin_name, {})
if entry.get("enabled") is not True:
    entry["enabled"] = True
    changed = True

if not changed:
    print("ok — plugin already registered and enabled")
    sys.exit(0)

with open(config_path, "w") as f:
    json.dump(c, f, indent=2)
    f.write("\n")

print("changed — plugin registered in", config_path)
