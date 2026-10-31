import pytest

from services.trip_service import (
    build_trip_plan,
    calculate_daily_budget,
    get_recommended_places,
    get_recommended_transportation,
    get_travel_season,
    get_trip_category,
    normalize_month,
)


@pytest.mark.parametrize(
    "budget, expected",
    [(700, "Backpacker"), (999.99, "Backpacker"), (1000, "Standard"), (2000, "Standard"),
     (3000, "Standard"), (5000, "Luxury")],
)
def test_trip_category(budget, expected):
    assert get_trip_category(budget) == expected


def test_daily_budget():
    assert calculate_daily_budget(1500, 5) == 300


def test_daily_budget_rejects_zero_days():
    with pytest.raises(ValueError):
        calculate_daily_budget(1500, 0)


@pytest.mark.parametrize(
    "category, transport",
    [("Backpacker", "Bus"), ("Standard", "Train"), ("Luxury", "Flight"), ("Other", "Unknown")],
)
def test_transportation(category, transport):
    assert get_recommended_transportation(category) == transport


@pytest.mark.parametrize(
    "month, season",
    [("December", "Peak Season"), ("dec", "Peak Season"), (12, "Peak Season"),
     ("June", "Holiday Season"), ("6", "Holiday Season"), ("March", "Regular Season"), (None, "Regular Season")],
)
def test_travel_season(month, season):
    assert get_travel_season(month) == season


def test_normalize_month():
    assert normalize_month("january") == "January"
    assert normalize_month(13) is None
    assert normalize_month("") is None


def test_recommended_places():
    assert get_recommended_places("tokyo")[0] == "Tokyo Tower"
    assert get_recommended_places("Atlantis") == []


def test_build_trip_plan():
    assert build_trip_plan(1500, 5, "December") == {
        "category": "Standard",
        "daily_budget": 300,
        "recommended_transport": "Train",
        "season": "Peak Season",
    }
