import json

from pipeline import build_dataset, build_winners_by_date, fetch_archive_bytes, load_historical_rows

OUTPUT_PATH = "../frontend/public/data/data.json"
WINNERS_OUTPUT_PATH = "../frontend/public/data/winners.json"


def main():
    print("Fetching Loto history...")
    zip_bytes = fetch_archive_bytes()

    print("Loading historical FDJ archives (2008-2019)...")
    historical_rows = load_historical_rows()

    data = build_dataset(zip_bytes, historical_rows)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Generated {len(data['draws'])} draws.")

    # Prize-tier detail, kept in its own lazily-fetched file so the main dataset
    # (loaded eagerly on every visit) stays light.
    winners = build_winners_by_date(zip_bytes, historical_rows)
    with open(WINNERS_OUTPUT_PATH, "w") as f:
        json.dump(winners, f, separators=(",", ":"))
    print(f"Generated prize-tier detail for {len(winners)} draws.")


if __name__ == "__main__":
    main()
