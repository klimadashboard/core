#!/usr/bin/env python3
"""
Convert emissions_data values from Megatons to tons for Regionalstatistik source.
Megatons -> tons = multiply by 1,000,000
"""

import os
import requests

# Configuration
DIRECTUS_URL = os.getenv("DIRECTUS_URL", "https://base.klimadashboard.org")
DIRECTUS_TOKEN = os.getenv("DIRECTUS_TOKEN")  # Set this environment variable


def main():
    if not DIRECTUS_TOKEN:
        print("Error: DIRECTUS_TOKEN environment variable not set")
        print("Usage: DIRECTUS_TOKEN=your_token python convert_emissions_mt_to_t.py")
        return

    headers = {"Authorization": f"Bearer {DIRECTUS_TOKEN}"}

    # Fetch all emissions_data where source contains 'Regionalstatistik'
    print("Fetching emissions_data with Regionalstatistik source...")

    response = requests.get(
        f"{DIRECTUS_URL}/items/emissions_data",
        headers=headers,
        params={
            "filter[source][_contains]": "Regionalstatistik",
            "limit": -1,
            "fields": "id,value,source,year,region,category",
        },
    )
    response.raise_for_status()
    items = response.json().get("data", [])

    if not items:
        print("No items found with Regionalstatistik source")
        return

    print(f"Found {len(items)} items to update")

    # Preview first few items
    print("\nPreview (first 5 items):")
    for item in items[:5]:
        old_value = item["value"]
        new_value = old_value * 1_000_000
        print(
            f"  ID {item['id']}: {old_value} Mt -> {new_value} t "
            f"(year: {item['year']}, category: {item['category']})"
        )

    # Confirm before proceeding
    confirm = input(f"\nProceed with updating {len(items)} items? (yes/no): ")
    if confirm.lower() != "yes":
        print("Aborted")
        return

    # Update each item
    print("\nUpdating items...")
    updated = 0
    errors = 0

    for item in items:
        try:
            new_value = item["value"] * 1_000_000
            patch_response = requests.patch(
                f"{DIRECTUS_URL}/items/emissions_data/{item['id']}",
                headers=headers,
                json={"value": new_value},
            )
            patch_response.raise_for_status()
            updated += 1
            if updated % 100 == 0:
                print(f"  Updated {updated}/{len(items)} items...")
        except Exception as e:
            print(f"  Error updating item {item['id']}: {e}")
            errors += 1

    print(f"\nDone! Updated {updated} items, {errors} errors")


if __name__ == "__main__":
    main()
