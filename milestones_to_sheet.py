#!/usr/bin/env python3
"""
Milestones → Recap Sheet Integration

Reads milestones_today.csv and formats it for the Recap Google Sheet's
MILESTONES section. Two modes:

1. STDOUT mode (default): prints rows ready to paste into Sheet
2. APPS_SCRIPT mode: POSTs to an Apps Script web app that writes to Sheet

Usage:
  python milestones_to_sheet.py                          # print to console
  python milestones_to_sheet.py --post URL               # POST to Apps Script
  python milestones_to_sheet.py --input other_file.csv   # custom input file
"""
import csv, io, json, sys, os

def load_milestones(path="milestones_today.csv"):
    """Load milestones CSV."""
    if not os.path.exists(path):
        print(f"  No milestones file found: {path}")
        return []
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def format_recap_rows(milestones):
    """
    Format milestones for the Recap Sheet's MILESTONES section.
    
    The Recap CSV expects these columns for MILESTONES:
    Col 0 (A): Player name
    Col 1 (B): (empty or RAT - unused)
    Col 2 (C): Passed player name  
    Col 3 (D): Category (Scoring, Rebounds, Assists, Steals, Blocks)
    Col 4 (E): Rank number
    Col 11 (L): Team logo URL (auto-filled by VLOOKUP in Sheet)
    
    This matches how generate_recap.py parses the MILESTONES section:
      name = hh(row[0].strip())
      passed = row[2].strip()
      cat = row[3].strip()
      rank = row[4].strip()
      logo = row[11].strip()
    """
    output = []
    for m in milestones:
        output.append({
            "player": m.get("PLAYER", ""),
            "passed": m.get("PASSED", ""),
            "category": m.get("CATEGORY", ""),
            "rank": m.get("RANK", ""),
            "stat_code": m.get("STAT_CODE", ""),
            "total": m.get("STAT_TOTAL", ""),
            "passed_total": m.get("PASSED_TOTAL", ""),
        })
    return output


def print_for_sheet(rows):
    """Print tab-separated rows ready to paste into Google Sheet."""
    # Header
    print("PLAYER\t\tPASSED\tCATEGORY\tRANK")
    for r in rows:
        # Col A=Player, B=empty, C=Passed, D=Category, E=Rank
        print(f"{r['player']}\t\t{r['passed']}\t{r['category']}\t{r['rank']}")


def post_to_apps_script(rows, url):
    """POST milestones to an Apps Script web app."""
    import requests
    payload = {
        "action": "update_milestones",
        "milestones": rows,
    }
    try:
        r = requests.post(url, json=payload, timeout=30)
        if r.ok:
            print(f"  ✓ Posted {len(rows)} milestones to Apps Script")
            print(f"    Response: {r.text[:200]}")
        else:
            print(f"  ✗ Apps Script returned {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"  ✗ Failed to POST: {e}")


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="milestones_today.csv")
    parser.add_argument("--post", help="Apps Script web app URL to POST to")
    args = parser.parse_args()

    milestones = load_milestones(args.input)
    if not milestones:
        print("  No milestones to process.")
        return

    rows = format_recap_rows(milestones)
    print(f"  {len(rows)} milestones loaded\n")

    if args.post:
        post_to_apps_script(rows, args.post)
    else:
        print("  Tab-separated rows (paste into Recap Sheet → MILESTONES section):\n")
        print_for_sheet(rows)
        print(f"\n  Tip: Copy everything between the lines and paste into your Sheet.")


if __name__ == "__main__":
    main()
