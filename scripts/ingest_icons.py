
import os
import re
import shutil
import difflib

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(PROJECT_ROOT, 'assets')
ICONS_DIR = os.path.join(PROJECT_ROOT, 'public', 'icons')
TRACKER_FILE = os.path.join(PROJECT_ROOT, 'remaining_icons_prompts.txt')

# Tier mapping
TIER_FOLDERS = {
    1: "Tier_1_Common",
    2: "Tier_2_Uncommon",
    3: "Tier_3_Rare",
    4: "Tier_4_Epic",
    5: "Tier_5_Ultra Epic",
    6: "Tier_6_Legendary",
    7: "Tier_7_Mythic",
    8: "Tier_8_Celestial",
    9: "Tier_9_Cosmic",
    10: "Tier_10_Divine"
}

# Regex
ENTRY_PATTERN = re.compile(r'^(\d+)\.\s+\[([ x])\]\s+\*\*(.+?)\*\*')

def normalize_name(name):
    return name.lower().strip().replace('_', ' ').replace('-', ' ')

def get_best_match(name, candidates):
    matches = difflib.get_close_matches(name, candidates.keys(), n=1, cutoff=0.85)
    return matches[0] if matches else None

def main():
    print(f"Starting ingestion from {ASSETS_DIR}...")
    
    if not os.path.exists(ASSETS_DIR):
        print("Assets directory not found.")
        return

    # 1. Parse Tracker
    with open(TRACKER_FILE, 'r') as f:
        lines = f.readlines()
    
    tracker_data = {} # id -> {line_idx, name, is_complete, tier}
    current_tier = 1
    
    for idx, line in enumerate(lines):
        if "Tier" in line and "Items" in line:
            if "Tier 1:" in line: current_tier = 1
            elif "Tier 2:" in line: current_tier = 2
            elif "Tier 3:" in line: current_tier = 3
            elif "Tier 4:" in line: current_tier = 4
            elif "Tier 5:" in line: current_tier = 5
            elif "Tier 6:" in line: current_tier = 6
            elif "Tier 7:" in line: current_tier = 7
            elif "Tier 8:" in line: current_tier = 8
            elif "Tier 9:" in line: current_tier = 9
            elif "Tier 10:" in line: current_tier = 10
            
        match = ENTRY_PATTERN.search(line)
        if match:
            icon_id = int(match.group(1))
            is_complete = match.group(2) == 'x'
            name = match.group(3)
            tracker_data[icon_id] = {
                'line_idx': idx,
                'name': name,
                'is_complete': is_complete,
                'tier': current_tier
            }

    print(f"Found {len(tracker_data)} tracked icons.")
    name_to_id = {normalize_name(data['name']): icon_id for icon_id, data in tracker_data.items()}
    
    # 2. Scan Assets
    asset_files = [f for f in os.listdir(ASSETS_DIR) if f.lower().endswith('.png')]
    print(f"Found {len(asset_files)} asset files.")
    
    updated_lines = lines[:]
    
    # Ensure tier directories exist
    for folder in TIER_FOLDERS.values():
        os.makedirs(os.path.join(ICONS_DIR, folder), exist_ok=True)
        
    matches_made = 0
    new_assignments = 0
    matched_ids = set()
    unmatched_assets = []

    # A. First Pass: Exact Matches
    for asset_file in asset_files:
        asset_name_norm = normalize_name(os.path.splitext(asset_file)[0])
        matched_name = get_best_match(asset_name_norm, name_to_id)
        
        if matched_name:
            target_id = name_to_id[matched_name]
            matches_made += 1
            matched_ids.add(target_id)
            
            src_path = os.path.join(ASSETS_DIR, asset_file)
            data = tracker_data[target_id]
            tier_folder = TIER_FOLDERS.get(data['tier'], "Tier_1_Common")
            dest_path = os.path.join(ICONS_DIR, tier_folder, f"icon_{target_id}.png")
            shutil.copy2(src_path, dest_path)
            
            # Mark [x] just in case
            line_idx = data['line_idx']
            updated_lines[line_idx] = updated_lines[line_idx].replace("[ ]", "[x]")
        else:
            unmatched_assets.append(asset_file)

    # B. Second Pass: Fill Unused Slots
    all_ids = set(tracker_data.keys())
    # Prefer low IDs (Tier 1) for replacements as they are likely generic
    unused_slots = sorted(list(all_ids - matched_ids))
    
    print(f"Exact matches: {matches_made}. Unmatched assets: {len(unmatched_assets)}. Unused slots: {len(unused_slots)}.")

    for asset_file in unmatched_assets:
        if not unused_slots:
            print(f"CRITICAL: No slots left for {asset_file}")
            continue
            
        target_id = unused_slots.pop(0)
        new_assignments += 1
        
        src_path = os.path.join(ASSETS_DIR, asset_file)
        data = tracker_data[target_id]
        tier_folder = TIER_FOLDERS.get(data['tier'], "Tier_1_Common")
        dest_path = os.path.join(ICONS_DIR, tier_folder, f"icon_{target_id}.png")
        shutil.copy2(src_path, dest_path)
        
        print(f"Overwriting Slot {target_id} ({data['name']}) with '{asset_file}'")

        # Update Tracker
        line_idx = data['line_idx']
        new_title = os.path.splitext(asset_file)[0].replace('_', ' ').title()
        
        current_line = updated_lines[line_idx]
        current_line = current_line.replace("[ ]", "[x]")
        current_line = re.sub(r'\*\*(.+?)\*\*', f'**{new_title}**', current_line)
        updated_lines[line_idx] = current_line
        
        # Wipe description
        if line_idx + 1 < len(updated_lines):
            updated_lines[line_idx + 1] = "Auto-ingested asset. Replacing placeholder.\n"

    # 3. Save Tracker
    # Update Total Count check
    total_complete = sum(1 for line in updated_lines if "[x]" in line)
    # Be careful not to break header
    if len(updated_lines) > 2:
        updated_lines[2] = f"**Total Status**: {total_complete}/150 Complete\n"
    
    with open(TRACKER_FILE, 'w') as f:
        f.writelines(updated_lines)

    print(f"\n--- Ingestion Complete ---")
    print(f"Matches found: {matches_made}")
    print(f"New assignments (Overwrites): {new_assignments}")
    print(f"Total processed: {matches_made + new_assignments}")

if __name__ == "__main__":
    main()
