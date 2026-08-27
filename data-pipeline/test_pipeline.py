import io
import zipfile

import pytest

from pipeline import (
    CHANCE_COLUMN,
    DATE_COLUMN,
    NUMBER_COLUMNS,
    build_dataset,
    build_winners_by_date,
    extract_prize_tiers,
    legacy_rows_to_draws,
    load_historical_rows,
    parse_draws_csv,
    parse_local_csv,
    rows_to_draws,
)

CSV_HEADER = ";".join([DATE_COLUMN, *NUMBER_COLUMNS, CHANCE_COLUMN])


def make_zip_bytes(csv_text: str, filename: str = "loto_201911.csv") -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr(filename, csv_text)
    return buffer.getvalue()


def make_csv(rows: list[str]) -> str:
    return "\n".join([CSV_HEADER, *rows])


def test_parse_draws_csv_extracts_rows_from_zip():
    csv_text = make_csv(["11/07/2026;3;16;35;38;34;2"])
    rows = parse_draws_csv(make_zip_bytes(csv_text))

    assert len(rows) == 1
    assert rows[0][DATE_COLUMN] == "11/07/2026"
    assert rows[0]["boule_1"] == "3"
    assert rows[0][CHANCE_COLUMN] == "2"


def test_rows_to_draws_sorts_chronologically_ascending():
    rows = [
        {DATE_COLUMN: "11/07/2026", "boule_1": "3", "boule_2": "16", "boule_3": "35", "boule_4": "38", "boule_5": "34", CHANCE_COLUMN: "2"},
        {DATE_COLUMN: "01/07/2026", "boule_1": "8", "boule_2": "9", "boule_3": "31", "boule_4": "10", "boule_5": "25", CHANCE_COLUMN: "5"},
    ]

    draws = rows_to_draws(rows)

    assert [d["date"] for d in draws] == ["2026-07-01", "2026-07-11"]


def test_rows_to_draws_sorts_numbers_ascending_within_a_draw():
    rows = [
        {DATE_COLUMN: "11/07/2026", "boule_1": "38", "boule_2": "3", "boule_3": "34", "boule_4": "16", "boule_5": "35", CHANCE_COLUMN: "2"},
    ]

    draws = rows_to_draws(rows)

    assert draws[0]["numbers"] == [3, 16, 34, 35, 38]


def test_rows_to_draws_converts_numbers_and_chance_to_int():
    rows = [
        {DATE_COLUMN: "11/07/2026", "boule_1": "3", "boule_2": "16", "boule_3": "35", "boule_4": "38", "boule_5": "34", CHANCE_COLUMN: "2"},
    ]

    draws = rows_to_draws(rows)

    assert all(isinstance(n, int) for n in draws[0]["numbers"])
    assert isinstance(draws[0]["chance"], int)


def test_rows_to_draws_raises_on_malformed_date():
    rows = [
        {DATE_COLUMN: "not-a-date", "boule_1": "3", "boule_2": "16", "boule_3": "35", "boule_4": "38", "boule_5": "34", CHANCE_COLUMN: "2"},
    ]

    with pytest.raises(ValueError):
        rows_to_draws(rows)


def test_rows_to_draws_deduplicates_same_date():
    rows = [
        {DATE_COLUMN: "11/07/2026", "boule_1": "3", "boule_2": "16", "boule_3": "35", "boule_4": "38", "boule_5": "34", CHANCE_COLUMN: "2"},
        {DATE_COLUMN: "11/07/2026", "boule_1": "1", "boule_2": "2", "boule_3": "3", "boule_4": "4", "boule_5": "5", CHANCE_COLUMN: "9"},
    ]

    draws = rows_to_draws(rows)

    assert len(draws) == 1
    assert draws[0]["numbers"] == [3, 16, 34, 35, 38]


def test_parse_local_csv_reads_semicolon_delimited_file(tmp_path):
    path = tmp_path / "archive.csv"
    path.write_text(make_csv(["06/10/2008;19;33;41;24;27;9"]), encoding="utf-8")

    rows = parse_local_csv(path)

    assert len(rows) == 1
    assert rows[0][DATE_COLUMN] == "06/10/2008"
    assert rows[0][CHANCE_COLUMN] == "9"


def test_load_historical_rows_reads_all_configured_files_in_order(tmp_path):
    (tmp_path / "a.csv").write_text(make_csv(["06/10/2008;19;33;41;24;27;9"]), encoding="utf-8")
    (tmp_path / "b.csv").write_text(make_csv(["04/03/2017;28;14;37;32;4;4"]), encoding="utf-8")

    rows = load_historical_rows(directory=tmp_path, filenames=["a.csv", "b.csv"])

    assert [r[DATE_COLUMN] for r in rows] == ["06/10/2008", "04/03/2017"]


def test_load_historical_rows_skips_missing_files(tmp_path):
    rows = load_historical_rows(directory=tmp_path, filenames=["missing.csv"])

    assert rows == []


def test_build_dataset_merges_historical_rows_with_the_live_feed():
    historical_rows = [
        {DATE_COLUMN: "06/10/2008", "boule_1": "19", "boule_2": "33", "boule_3": "41", "boule_4": "24", "boule_5": "27", CHANCE_COLUMN: "9"},
    ]
    csv_text = make_csv(["11/07/2026;3;16;35;38;34;2"])

    data = build_dataset(make_zip_bytes(csv_text), historical_rows)

    assert len(data["draws"]) == 2
    assert data["draws"][0]["date"] == "2008-10-06"
    assert data["draws"][1]["date"] == "2026-07-11"


def test_build_dataset_returns_last_update_and_draws():
    csv_text = make_csv([
        "11/07/2026;3;16;35;38;34;2",
        "01/07/2026;8;9;31;10;25;5",
    ])

    data = build_dataset(make_zip_bytes(csv_text))

    assert "last_update" in data
    assert len(data["draws"]) == 2
    assert data["draws"][0]["date"] == "2026-07-01"
    assert data["draws"][1]["date"] == "2026-07-11"


def test_rows_to_draws_includes_prize_tiers_when_present():
    rows = [
        {
            DATE_COLUMN: "11/07/2026", "boule_1": "3", "boule_2": "16", "boule_3": "35", "boule_4": "38", "boule_5": "34", CHANCE_COLUMN: "2",
            "nombre_de_gagnant_au_rang1": "0", "rapport_du_rang1": "5000000,00",
            "nombre_de_gagnant_au_rang2": "2", "rapport_du_rang2": "83839",
        },
    ]

    draws = rows_to_draws(rows)

    assert draws[0]["winners"] == [
        {"rank": 1, "winners": 0, "payout": 5000000.0},
        {"rank": 2, "winners": 2, "payout": 83839.0},
    ]


def test_extract_prize_tiers_stops_at_first_missing_rank():
    row = {"nombre_de_gagnant_au_rang1": "1", "rapport_du_rang1": "100"}

    tiers = extract_prize_tiers(row)

    assert [t["rank"] for t in tiers] == [1]


def test_extract_prize_tiers_parses_french_decimal_and_thousands_separators():
    row = {"nombre_de_gagnant_au_rang1": "8", "rapport_du_rang1": "10 953,90"}

    tiers = extract_prize_tiers(row)

    assert tiers[0]["payout"] == 10953.9


def test_extract_prize_tiers_handles_missing_payout():
    row = {"nombre_de_gagnant_au_rang1": "0", "rapport_du_rang1": ""}

    tiers = extract_prize_tiers(row)

    assert tiers[0] == {"rank": 1, "winners": 0, "payout": None}


def test_legacy_rows_to_draws_parses_yyyymmdd_dates_and_six_numbers():
    rows = [
        {
            DATE_COLUMN: "20081004", "boule_1": "33", "boule_2": "32", "boule_3": "42", "boule_4": "16", "boule_5": "15", "boule_6": "49",
            "boule_complementaire": "37", "devise": "eur",
        },
    ]

    draws = legacy_rows_to_draws(rows)

    assert draws[0]["date"] == "2008-10-04"
    assert draws[0]["numbers"] == [15, 16, 32, 33, 42, 49]
    assert draws[0]["complementary"] == 37
    assert draws[0]["currency"] == "eur"


def test_legacy_rows_to_draws_keeps_both_same_day_draws_in_order():
    rows = [
        {
            DATE_COLUMN: "20081004", "1er_ou_2eme_tirage": "2", "boule_1": "1", "boule_2": "2", "boule_3": "3", "boule_4": "4", "boule_5": "5",
            "boule_6": "6", "boule_complementaire": "7", "devise": "eur",
        },
        {
            DATE_COLUMN: "20081004", "1er_ou_2eme_tirage": "1", "boule_1": "10", "boule_2": "20", "boule_3": "30", "boule_4": "40", "boule_5": "45",
            "boule_6": "49", "boule_complementaire": "8", "devise": "eur",
        },
    ]

    draws = legacy_rows_to_draws(rows)

    assert len(draws) == 2
    assert [d["date"] for d in draws] == ["2008-10-04", "2008-10-04"]
    assert draws[0]["numbers"] == [10, 20, 30, 40, 45, 49]
    assert draws[1]["numbers"] == [1, 2, 3, 4, 5, 6]


def test_legacy_rows_to_draws_preserves_franc_currency():
    rows = [
        {
            DATE_COLUMN: "19960503", "boule_1": "1", "boule_2": "2", "boule_3": "3", "boule_4": "4", "boule_5": "5", "boule_6": "6",
            "boule_complementaire": "7", "devise": "frf",
        },
    ]

    draws = legacy_rows_to_draws(rows)

    assert draws[0]["currency"] == "frf"


def test_build_dataset_excludes_winners_to_keep_the_main_payload_light():
    csv_text = make_csv([
        "11/07/2026;3;16;35;38;34;2;0;5000000",
    ])

    data = build_dataset(make_zip_bytes(csv_text))

    assert "winners" not in data["draws"][0]


def test_build_winners_by_date_keyed_by_draw_date():
    historical_rows = [
        {
            DATE_COLUMN: "06/10/2008", "boule_1": "19", "boule_2": "33", "boule_3": "41", "boule_4": "24", "boule_5": "27", CHANCE_COLUMN: "9",
            "nombre_de_gagnant_au_rang1": "1", "rapport_du_rang1": "1000000",
        },
    ]
    csv_text = make_csv(["11/07/2026;3;16;35;38;34;2"])

    winners = build_winners_by_date(make_zip_bytes(csv_text), historical_rows)

    assert winners == {"2008-10-06": [{"rank": 1, "winners": 1, "payout": 1000000.0}]}
    assert "2026-07-11" not in winners


def test_legacy_rows_to_draws_defaults_currency_to_eur_when_missing():
    rows = [
        {
            DATE_COLUMN: "19960503", "boule_1": "1", "boule_2": "2", "boule_3": "3", "boule_4": "4", "boule_5": "5", "boule_6": "6",
            "boule_complementaire": "7",
        },
    ]

    draws = legacy_rows_to_draws(rows)

    assert draws[0]["currency"] == "eur"
