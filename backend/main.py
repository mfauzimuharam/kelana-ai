#challenge dan homework saya gabung jadi 1 ya kak, jadi outputnya lebih dari yang ada di spek tugas
def print_trip_summary(destination, country, days, budget,currency, travel_month, travel_style, total_cost):
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

print("\n--- Masukkan Estimasi Biaya ---")
hotel_cost = float(input("Hotel Cost : "))
food_cost = float(input("Food Cost : "))
transport_cost = float(input("Transportation Cost : "))
misc_cost = float(input("Miscellaneous Cost : "))

total_cost = hotel_cost + food_cost + transport_cost + misc_cost

print("\n--- Ringkasan Perjalanan Kamu ---")
print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost)