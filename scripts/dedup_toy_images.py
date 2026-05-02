#!/usr/bin/env python3
"""
Deduplicate image URLs in toyImages.ts.
Removes cross-kit duplicate URLs: the first occurrence is kept, subsequent ones removed.
heroImage URLs are never removed.
"""
import re

INPUT = "client/src/data/toyImages.ts"

with open(INPUT, "r") as f:
    lines = f.readlines()

global_seen = set()
total_removed = 0
new_lines = []
in_toy_images = False

# First pass: collect all heroImage URLs so they're never removed
hero_urls = set()
for line in lines:
    m = re.match(r'\s+heroImage:\s+"(https?://[^"]+)"', line)
    if m:
        hero_urls.add(m.group(1))

# Second pass: deduplicate toyImages arrays
for line in lines:
    # Check if we're entering a toyImages array
    if 'toyImages: [' in line:
        in_toy_images = True
        new_lines.append(line)
        continue
    
    if in_toy_images:
        # Check if this line ends the array
        if re.match(r'\s+\],', line):
            in_toy_images = False
            new_lines.append(line)
            continue
        
        # Extract URL from this line
        m = re.search(r'"(https?://[^"]+)"', line)
        if m:
            url = m.group(1)
            if url in global_seen and url not in hero_urls:
                total_removed += 1
                continue  # Skip duplicate
            global_seen.add(url)
    
    new_lines.append(line)

with open(INPUT, "w") as f:
    f.writelines(new_lines)

print(f"Removed {total_removed} cross-kit duplicate URLs from toyImages.ts")
