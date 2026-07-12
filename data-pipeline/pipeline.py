import csv
import io
import zipfile
from datetime import datetime

import requests

# Archive officielle FDJ des tirages Loto (format en vigueur depuis nov. 2019).
LOTO_ARCHIVE_URL = "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afp6"

NUMBER_COLUMNS = ["boule_1", "boule_2", "boule_3", "boule_4", "boule_5"]
CHANCE_COLUMN = "numero_chance"
DATE_COLUMN = "date_de_tirage"


def fetch_archive_bytes(url: str = LOTO_ARCHIVE_URL, timeout: int = 30) -> bytes:
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    return response.content


def parse_draws_csv(zip_bytes: bytes) -> list[dict]:
    """Extracts and parses the official FDJ CSV into a list of raw row dicts."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        csv_name = archive.namelist()[0]
        with archive.open(csv_name) as csv_file:
            text = io.TextIOWrapper(csv_file, encoding="utf-8")
            return list(csv.DictReader(text, delimiter=";"))


def rows_to_draws(rows: list[dict]) -> list[dict]:
    """Converts raw CSV rows into clean, sorted draw records."""
    draws = []
    for row in rows:
        date = datetime.strptime(row[DATE_COLUMN], "%d/%m/%Y")
        numbers = sorted(int(row[c]) for c in NUMBER_COLUMNS)
        chance = int(row[CHANCE_COLUMN])
        draws.append({"date": date, "numbers": numbers, "chance": chance})

    draws.sort(key=lambda d: d["date"])

    return [
        {
            "date": d["date"].strftime("%Y-%m-%d"),
            "numbers": d["numbers"],
            "chance": d["chance"],
        }
        for d in draws
    ]


def build_dataset(zip_bytes: bytes) -> dict:
    rows = parse_draws_csv(zip_bytes)
    draws = rows_to_draws(rows)
    return {
        "last_update": datetime.now().strftime("%Y-%m-%d"),
        "draws": draws,
    }
