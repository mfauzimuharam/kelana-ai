"""KelanaAI console app (Sessions 1-2): Trip Summary Generator.

Run:  python cli.py
Presentation layer only — every decision comes from services/trip_service.py,
the same business logic the REST API uses.
"""

from services.trip_service import (
    calculate_daily_budget,
    get_recommended_places,
    get_recommended_transportation,
    get_travel_season,
    get_trip_category,
)


def ask_int(prompt: str) -> int:
    while True:
        try:
            value = int(input(prompt))
            if value > 0:
                return value
        except ValueError:
            pass
        print("  Please enter a whole number greater than 0.")


def ask_float(prompt: str, allow_zero: bool = False) -> float:
    while True:
        try:
            value = float(input(prompt))
            if value > 0 or (allow_zero and value == 0):
                return value
        except ValueError:
            pass
        print("  Please enter a valid number.")


def print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost):
    print("\n==================================")
    print("KelanaAI Trip Summary")
    print("==================================")
    print(f"Destination  : {destination}")
    print(f"Country      : {country}")
    print(f"Days         : {days}")
    print(f"Budget       : {budget:,.2f} {currency}")
    print(f"Travel Month : {travel_month}")
    print(f"Season       : {get_travel_season(travel_month)}")
    print(f"Style        : {travel_style}")
    print(f"Total Cost   : {total_cost:,.2f} {currency}")
    if total_cost > budget:
        print("Status       : ⚠ Budget exceeded.")
    else:
        print("Status       : ✅ Budget is sufficient.")
    print("==================================\n")


def main():
    print("--- Trip Details ---")
    destination = input("Destination (e.g., Bali, Tokyo) : ").strip().title()
    country = input("Country : ").strip().title()
    days = ask_int("Days : ")
    budget = ask_float("Budget : ")
    currency = input("Currency (e.g., USD, IDR) : ").strip().upper() or "USD"
    travel_month = input("Month of Travel (e.g., December) : ").strip().title()
    travel_style = input("Travel Style (e.g., Family, Solo) : ").strip().title()

    print("\n--- Estimated Costs ---")
    hotel_cost = ask_float("Hotel Cost : ", allow_zero=True)
    food_cost = ask_float("Food Cost : ", allow_zero=True)
    transport_cost = ask_float("Transportation Cost : ", allow_zero=True)
    misc_cost = ask_float("Miscellaneous Cost : ", allow_zero=True)
    total_cost = hotel_cost + food_cost + transport_cost + misc_cost

    daily_budget = calculate_daily_budget(budget, days)
    category = get_trip_category(budget)
    transportation = get_recommended_transportation(category)
    places = get_recommended_places(destination)

    print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost)
    print(f"Daily Budget               : {daily_budget:,.2f} {currency}/day")
    print(f"Trip Category              : {category}")
    print(f"Recommended Transportation : {transportation}")

    print("\nRecommended Places")
    for place in places or ["No recommendations available for this destination yet."]:
        print(f" - {place}")

    print("\n--- Multiple Destinations ---")
    destinations = [destination]
    while True:
        place = input("Add another destination (or type 'done') : ").strip().title()
        if place.lower() == "done" or not place:
            break
        destinations.append(place)

    print("\nYour Destinations")
    for number, dest in enumerate(destinations, start=1):
        print(f"{number}. {dest}")


if __name__ == "__main__":
    main()
