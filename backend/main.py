from services.trip_service import calculate_daily_budget, get_trip_category, get_recommended_places, get_recommended_transportation
def print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost):
    print("========================" )
    print("KelanaAI" )
    print("========================" )
    print(f"Destination  : {destination}" )
    print(f"Country      : {country}" )
    print(f"Days         : {days}" )
    print(f"Budget       : {budget} {currency}" )
    print(f"Currency     : {currency}" )
    print(f"Travel Month : {travel_month}" ) 
    print(f"Style        : {travel_style}" )
    print(f"Total Cost   : {total_cost} {currency}" ) # Ditambah currency agar lebih jelas
    if total_cost > budget:
        print("Budget exceeded" )
    else:
        print("Budget is sufficient" )
    return "\n"

print("--- Masukkan Data Perjalanan ---")
destination = input("Destination : ")
country = input("Country : ")
days = int(input("Days : "))
budget = float(input("Budget : "))
currency = input("Currency (e.g., USD, IDR) : ")
travel_month = input("Month of Travel (e.g., December) : ")
travel_style = input("Travel Style : ")

#core challenge 2
daily_budget = calculate_daily_budget(budget, days)
category = get_trip_category(daily_budget) #menurut saya lebih tepat kategori perjalanan ditentukan oleh budget per hari, bukan total budget
transportation = get_recommended_transportation(category)
print(f"Recommended Transportation: {transportation}")

print("\n--- Masukkan Estimasi Biaya ---")
hotel_cost = float(input("Hotel Cost : "))
food_cost = float(input("Food Cost : "))
transport_cost = float(input("Transportation Cost : "))
misc_cost = float(input("Miscellaneous Cost : "))

total_cost = hotel_cost + food_cost + transport_cost + misc_cost

print("\n--- Ringkasan Perjalanan Kamu ---")
print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost)


Recommended_places = get_recommended_places(destination)
print("\n--- Recommended Places to Visit ---")
for place in Recommended_places:
    print(f"- {place}")

#bonus sesi 2
destinations = []

while True:
    place = input("Enter a destination (or type 'done' to finish): ")
    if place.lower() == 'done':
        break
    destinations.append(place)

print("your full trip destinations are: ", destinations)