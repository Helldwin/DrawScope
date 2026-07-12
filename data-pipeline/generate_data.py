import json

from pipeline import build_dataset, fetch_archive_bytes

OUTPUT_PATH = "../frontend/public/data/data.json"


def main():
    print("Fetching Loto history...")
    zip_bytes = fetch_archive_bytes()
    data = build_dataset(zip_bytes)

    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Generated {len(data['draws'])} draws.")


if __name__ == "__main__":
    main()
