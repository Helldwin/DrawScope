import io
import zipfile

import pytest

from pipeline import CHANCE_COLUMN, DATE_COLUMN, NUMBER_COLUMNS, build_dataset, parse_draws_csv, rows_to_draws

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
