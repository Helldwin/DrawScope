import json

from pipeline import build_archives

# Split into per-tab files (rather than one combined archive.json) so visiting
# one archive tab doesn't pull in the other two — the pre-2008 Loto alone is by
# far the largest of the three.
LOTO_PRE_2008_OUTPUT_PATH = "../frontend/public/data/archive-loto-pre2008.json"
SUPER_LOTO_OUTPUT_PATH = "../frontend/public/data/archive-super-loto.json"
GRAND_LOTO_OUTPUT_PATH = "../frontend/public/data/archive-grand-loto.json"


def write_json(path: str, data) -> None:
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))


def main():
    print("Building display-only archives (pre-2008 Loto, Super Loto, Grand Loto)...")
    data = build_archives()

    write_json(LOTO_PRE_2008_OUTPUT_PATH, data["preHistoryLoto"])
    write_json(SUPER_LOTO_OUTPUT_PATH, {"modern": data["superLoto"], "legacy": data["superLotoLegacy"]})
    write_json(GRAND_LOTO_OUTPUT_PATH, data["grandLoto"])

    print(
        f"Generated {len(data['preHistoryLoto'])} pre-2008 Loto draws, "
        f"{len(data['superLoto']) + len(data['superLotoLegacy'])} Super Loto draws, "
        f"{len(data['grandLoto'])} Grand Loto draws."
    )


if __name__ == "__main__":
    main()
