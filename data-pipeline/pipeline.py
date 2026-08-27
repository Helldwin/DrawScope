import csv
import io
import zipfile
from datetime import datetime
from pathlib import Path

import requests

# Archive officielle FDJ des tirages Loto (format en vigueur depuis nov. 2019).
LOTO_ARCHIVE_URL = "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afp6"

NUMBER_COLUMNS = ["boule_1", "boule_2", "boule_3", "boule_4", "boule_5"]
CHANCE_COLUMN = "numero_chance"
DATE_COLUMN = "date_de_tirage"

# Legacy pre-2008 archives (old Loto, old Super Loto) use 6 boules + a single
# "boule complémentaire" instead of 5 boules + numéro chance, dates as
# YYYYMMDD instead of DD/MM/YYYY, and sometimes two draws on the same day.
LEGACY_NUMBER_COLUMNS = ["boule_1", "boule_2", "boule_3", "boule_4", "boule_5", "boule_6"]
LEGACY_COMPLEMENTARY_COLUMN = "boule_complementaire"
LEGACY_DRAW_NUMBER_COLUMN = "1er_ou_2eme_tirage"
CURRENCY_COLUMN = "devise"

FDJ_ARCHIVES_DIR = Path(__file__).parent / "fdj_archives"
LOTO_DIR = FDJ_ARCHIVES_DIR / "LOTO"
SUPER_LOTO_DIR = FDJ_ARCHIVES_DIR / "Super Loto"
GRAND_LOTO_DIR = FDJ_ARCHIVES_DIR / "Grand Loto"

# Historical FDJ archives sharing the live feed's format (5 boules 1-49 + numéro
# chance 1-10), extending the main dataset's history back to the Oct. 2008
# "Nouveau Loto" reform.
HISTORICAL_ARCHIVES_DIR = LOTO_DIR
HISTORICAL_CSV_FILES = [
    "Nouveau_Loto_Octobre2008-Mars2017.csv",
    "loto2017_Mars2017-Fevrier2019.csv",
    "loto_201902_Fevrier2019-Novembre2019.csv",
]

# Everything below is display-only "archive" material (browsable in the app but
# excluded from the main stats/simulator dataset): the pre-2008 6-boules Loto,
# and the exceptional Super Loto / Grand Loto special-jackpot editions.
PRE_2008_LOTO_FILE = "Loto_Mai1976-Octobre2008.csv"

SUPER_LOTO_MODERN_FILES = [
    "nouveau_superloto_Fevrier2009-Janvier2017.csv",
    "superloto2017_Octobre2017-Septembre2018.csv",
    "superloto_201907_Juillet2019-Avril2026.csv",
]
SUPER_LOTO_LEGACY_FILE = "sloto_Mai1996-Juin2008.csv"

GRAND_LOTO_FILES = [
    "lotonoel2017_Decembre2017-Decembre2018.csv",
    "grandloto_201912_Decembre2019-Decembre2025.csv",
]


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


def parse_local_csv(path) -> list[dict]:
    """Parses an FDJ archive CSV file (semicolon-delimited), whatever era/game it's from."""
    with open(path, newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file, delimiter=";"))


def load_rows_from_files(directory: Path, filenames: list[str]) -> list[dict]:
    """Loads and concatenates raw rows from a list of local CSV files, skipping any that are missing."""
    rows = []
    for filename in filenames:
        path = directory / filename
        if path.exists():
            rows.extend(parse_local_csv(path))
    return rows


def load_historical_rows(directory: Path = HISTORICAL_ARCHIVES_DIR, filenames: list[str] = HISTORICAL_CSV_FILES) -> list[dict]:
    """Loads the pre-Nov.-2019 archives that share the live feed's format, oldest-file-first."""
    return load_rows_from_files(directory, filenames)


def _parse_amount(raw: str | None) -> float | None:
    """Parses an FDJ payout figure ("10 953,90") into a float, French decimal comma and thousands spaces included."""
    text = (raw or "").strip()
    if not text:
        return None
    try:
        return float(text.replace(" ", "").replace("\xa0", "").replace(",", "."))
    except ValueError:
        return None


def extract_prize_tiers(row: dict) -> list[dict]:
    """Reads the nombre_de_gagnant_au_rangN / rapport_du_rangN columns present on a row (however many ranks that era's format has)."""
    tiers = []
    rank = 1
    while True:
        winners_key = f"nombre_de_gagnant_au_rang{rank}"
        payout_key = f"rapport_du_rang{rank}"
        if winners_key not in row:
            break
        winners_raw = (row.get(winners_key) or "").strip()
        if winners_raw != "":
            tiers.append({
                "rank": rank,
                "winners": int(winners_raw),
                "payout": _parse_amount(row.get(payout_key)),
            })
        rank += 1
    return tiers


def rows_to_draws(rows: list[dict], include_winners: bool = True) -> list[dict]:
    """Converts raw CSV rows (modern 5-boules + numéro chance format) into clean, sorted, deduplicated draw records.
    `include_winners` is off for the main stats dataset (fetched eagerly on every app load, and the prize-tier
    breakdown isn't needed for any computation there) and on for the archive datasets (fetched lazily, detail included)."""
    draws = []
    seen_dates = set()
    for row in rows:
        date = datetime.strptime(row[DATE_COLUMN], "%d/%m/%Y")
        if date in seen_dates:
            continue
        seen_dates.add(date)
        numbers = sorted(int(row[c]) for c in NUMBER_COLUMNS)
        chance = int(row[CHANCE_COLUMN])
        draws.append({"date": date, "numbers": numbers, "chance": chance, "winners": extract_prize_tiers(row) if include_winners else None})

    draws.sort(key=lambda d: d["date"])

    return [
        {
            "date": d["date"].strftime("%Y-%m-%d"),
            "numbers": d["numbers"],
            "chance": d["chance"],
            **({"winners": d["winners"]} if include_winners else {}),
        }
        for d in draws
    ]


def legacy_rows_to_draws(rows: list[dict]) -> list[dict]:
    """Converts raw rows from a pre-2008 archive (6 boules + complémentaire, no numéro chance, YYYYMMDD dates)
    into clean, sorted draw records. Same-day double draws (old Loto's 1er/2e tirage) are both kept, in order."""
    draws = []
    for row in rows:
        date = datetime.strptime(row[DATE_COLUMN], "%Y%m%d")
        draw_number = int(row[LEGACY_DRAW_NUMBER_COLUMN]) if row.get(LEGACY_DRAW_NUMBER_COLUMN) else 1
        numbers = sorted(int(row[c]) for c in LEGACY_NUMBER_COLUMNS)
        complementary = int(row[LEGACY_COMPLEMENTARY_COLUMN])
        currency = (row.get(CURRENCY_COLUMN) or "eur").strip().lower() or "eur"
        draws.append({
            "date": date,
            "draw_number": draw_number,
            "numbers": numbers,
            "complementary": complementary,
            "currency": currency,
            "winners": extract_prize_tiers(row),
        })

    draws.sort(key=lambda d: (d["date"], d["draw_number"]))

    return [
        {
            "date": d["date"].strftime("%Y-%m-%d"),
            "numbers": d["numbers"],
            "complementary": d["complementary"],
            "currency": d["currency"],
            "winners": d["winners"],
        }
        for d in draws
    ]


def build_dataset(zip_bytes: bytes, historical_rows: list[dict] | None = None) -> dict:
    rows = parse_draws_csv(zip_bytes)
    if historical_rows:
        rows = historical_rows + rows
    draws = rows_to_draws(rows, include_winners=False)
    return {
        "last_update": datetime.now().strftime("%Y-%m-%d"),
        "draws": draws,
    }


def build_winners_by_date(zip_bytes: bytes, historical_rows: list[dict] | None = None) -> dict:
    """Prize-tier detail for the main dataset, keyed by date — kept out of build_dataset's payload and
    fetched lazily by the app only when a draw's detail is actually opened."""
    rows = parse_draws_csv(zip_bytes)
    if historical_rows:
        rows = historical_rows + rows
    draws = rows_to_draws(rows, include_winners=True)
    return {d["date"]: d["winners"] for d in draws if d["winners"]}


def build_archives() -> dict:
    """Builds the display-only archive datasets: the pre-2008 Loto, and the Super Loto / Grand Loto special
    editions. Intentionally excluded from the main stats dataset (different game format, or exceptional
    draws outside the regular schedule) but browsable in the app as their own history."""
    pre_history_loto = legacy_rows_to_draws(load_rows_from_files(LOTO_DIR, [PRE_2008_LOTO_FILE]))
    super_loto = rows_to_draws(load_rows_from_files(SUPER_LOTO_DIR, SUPER_LOTO_MODERN_FILES))
    super_loto_legacy = legacy_rows_to_draws(load_rows_from_files(SUPER_LOTO_DIR, [SUPER_LOTO_LEGACY_FILE]))
    grand_loto = rows_to_draws(load_rows_from_files(GRAND_LOTO_DIR, GRAND_LOTO_FILES))

    return {
        "preHistoryLoto": pre_history_loto,
        "superLoto": super_loto,
        "superLotoLegacy": super_loto_legacy,
        "grandLoto": grand_loto,
    }
