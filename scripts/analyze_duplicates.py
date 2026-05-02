#!/usr/bin/env python3
"""Analyze duplicate image URLs in toyImages.ts"""
import re
import sys

with open("client/src/data/toyImages.ts", "r") as f:
    content = f.read()

# Parse kit-by-kit
kit_pattern = re.compile(r'"(\w[\w-]*)"\s*:\s*\{[^}]*heroImage:\s*"([^"]*)"[^}]*toyImages:\s*\[(.*?)\]', re.DOTALL)

kit_images = {}
for m in kit_pattern.finditer(content):
    kit_id = m.group(1)
    hero = m.group(2)
    toys_str = m.group(3)
    toy_urls = re.findall(r'"(https?://[^"]+)"', toys_str)
    kit_images[kit_id] = {"hero": hero, "toys": toy_urls}

# Find duplicates across kits
url_to_kits = {}
for kit_id, data in kit_images.items():
    for url in data["toys"]:
        if url not in url_to_kits:
            url_to_kits[url] = []
        url_to_kits[url].append(kit_id)

print("=== Kits with duplicate toyImages ===")
for url, kits in url_to_kits.items():
    if len(kits) > 1:
        print(f"  URL shared by: {', '.join(kits)}")
        print(f"    {url[:80]}...")

# Check which kits share ALL their images
print("\n=== Kits with identical toyImages arrays ===")
seen = {}
for kit_id, data in kit_images.items():
    key = tuple(data["toys"])
    if key in seen:
        print(f"  {kit_id} has SAME images as {seen[key]}")
    else:
        seen[key] = kit_id
