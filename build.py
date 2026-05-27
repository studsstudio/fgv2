#!/usr/bin/env python3
"""
Field Gradients — build script
Run: python build.py
Output: index.html (fully self-contained, works via file:// and any server)
"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))

def read(name):
    with open(os.path.join(BASE, name)) as f:
        return f.read()

# 1. Start with the HTML shell
html = read('shell.html')

# 2. Inline CSS
css = read('fg-styles.css')
html = html.replace(
    '<link rel="stylesheet" href="fg-styles.css">',
    f'<style>\n{css}\n</style>'
)

# 3. Inline each JS module in order
modules = [
    'fg-data.js',
    'fg-entitlements.js',
    'fg-state.js',
    'fg-audio.js',
    'fg-recorder.js',
    'fg-instruments.js',
    'fg-visual.js',
    'fg-conductor.js',
    'fg-live.js',
    'fg-auth.js',
    'fg-ui.js',
]

for mod in modules:
    js = read(mod)
    html = html.replace(
        f'<script src="{mod}"></script>',
        f'<script>\n/* === {mod} === */\n{js}\n</script>'
    )

# 4. Write output
out = os.path.join(BASE, 'index.html')
with open(out, 'w') as f:
    f.write(html)

lines = html.count('\n') + 1
print(f"Built index.html — {lines} lines")
print("Open index.html in any browser. No server needed.")
