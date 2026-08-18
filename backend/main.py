# main.py

from services.trip_service import (
    calculate_daily_budget, 
    get_trip_category, 
    get_recommended_places, 
    get_recommended_transportation
)

def print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost):
    """Fungsi ini bertindak sebagai 'Presentation Layer' untuk menampilkan data ke pengguna."""
    print("\n==================================")
    print("KelanaAI Trip Summary")
    print("==================================")
    print(f"Destination  : {destination}")
    print(f"Country      : {country}")
    print(f"Days         : {days}")
    print(f"Budget       : {budget} {currency}")
    print(f"Travel Month : {travel_month}")
    print(f"Style        : {travel_style}")
    print(f"Total Cost   : {total_cost} {currency}")
    
    if total_cost > budget:
        print("Status       : Budget exceeded! ⚠️")
    else:
        print("Status       : Budget is sufficient. ✅")
    print("==================================\n")

def main():
    print("--- Masukkan Data Perjalanan ---")
    # Menggunakan .strip().title() agar input "bali" menjadi "Bali" (sesuai dictionary di service)
    destination = input("Destination (e.g., Bali, Tokyo) : ").strip().title()
    country = input("Country : ")
    days = int(input("Days : "))
    budget = float(input("Budget : "))
    currency = input("Currency (e.g., USD, IDR) : ").upper()
    travel_month = input("Month of Travel (e.g., December) : ").title()
    travel_style = input("Travel Style : ")

    print("\n--- Masukkan Estimasi Biaya ---")
    hotel_cost = float(input("Hotel Cost : "))
    food_cost = float(input("Food Cost : "))
    transport_cost = float(input("Transportation Cost : "))
    misc_cost = float(input("Miscellaneous Cost : "))

    total_cost = hotel_cost + food_cost + transport_cost + misc_cost

    # ─── MENGHUBUNGI "BACKEND" (Memanggil Service) ──────────
    # Menghitung budget harian
    daily_budget = calculate_daily_budget(budget, days)
    
    # Menentukan kategori berdasarkan budget harian (Sesuai modifikasi cerdasmu)
    category = get_trip_category(daily_budget) 
    
    # Menentukan transportasi berdasarkan kategori
    transportation = get_recommended_transportation(category)
    
    # Mengambil rekomendasi tempat berdasarkan destinasi
    recommended_places = get_recommended_places(destination)
    # ────────────────────────────────────────────────────────

    # ─── MENAMPILKAN HASIL ──────────────────────────────────
    print_trip_summary(destination, country, days, budget, currency, travel_month, travel_style, total_cost)

    print(f"Daily Budget               : {daily_budget:.2f} {currency}/day")
    print(f"Trip Category              : {category}")
    print(f"Recommended Transportation : {transportation}")

    print("\n--- Recommended Places to Visit ---")
    for place in recommended_places:
        print(f"📍 {place}")

    # ─── BONUS: MULTIPLE DESTINATIONS ───────────────────────
    print("\n--- Perluas Rute Perjalanan Kamu ---")
    destinations = [destination] 

    while True:
        place = input("Enter an additional destination (or type 'done' to finish): ").strip().title()
        if place.lower() == 'done':
            break
        destinations.append(place)

    print("\nYour full trip destinations are:")
    for dest in destinations:
        print(f"✈️  {dest}")

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI"}

# 1. Tambahkan parameter 'travel_style' pada model Pydantic untuk request POST
class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str | None = None  # Menambahkan input travel_style opsional

# 2. Perbarui endpoint POST /api/v1/trips (menggunakan logika transportasi)
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category = get_trip_category(request.budget)
    
    # Menentukan rekomendasi transportasi berdasarkan travel_style
    # (Kamu bisa menyesuaikan fungsi ini dengan aturan bisnis dari Sesi 2)
    transport = "Flight" # Default
    if request.travel_style == "Family":
        transport = "Train"
    elif request.travel_style == "Solo":
        transport = "Bus"

    return {
        "destination": request.destination,
        "budget": request.budget,
        "daily_budget": daily_budget,
        "category": category,
        "recommendation_transport": transport, # Menambahkan respons transport
    }

# 3. Mengerjakan BONUS: Endpoint GET /api/v1/trip-categories
@app.get("/api/v1/trip-categories")
def get_trip_categories():
    return [
        "Backpacker",
        "Standard",
        "Luxury"
    ]

@app.get("/api/v1/recommendations")
def get_recommendations():
    return ["Tokyo Tower", "Mount Fuji", "Shibuya"]

@app.get("/api/v1/transportations")
def get_transportations():
    return ["Bus", "Train", "Flight"]

if __name__ == "__main__":
    main()