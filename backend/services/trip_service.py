"""Business layer (Session 2): rule-based recommendation engine.

Pure functions only — no HTTP, no database. Reused unchanged by the console
app (cli.py), the REST API and the AI prompt builder.
"""

TRIP_CATEGORIES = ["Backpacker", "Standard", "Luxury"]
TRANSPORTATIONS = ["Bus", "Train", "Flight"]
TRAVEL_STYLES = ["Solo", "Couple", "Family", "Friends", "Business"]

MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

RECOMMENDED_PLACES = {
    "Bali": ["Ubud", "Kuta", "Seminyak", "Nusa Dua", "Uluwatu"],
    "Paris": ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral", "Montmartre", "Champs-Élysées"],
    "Tokyo": ["Tokyo Tower", "Shibuya Crossing", "Mount Fuji", "Senso-ji Temple", "Akihabara"],
    "Japan": ["Tokyo Tower", "Shibuya", "Mount Fuji", "Kyoto Fushimi Inari", "Osaka Dotonbori"],
    "New York": ["Statue of Liberty", "Central Park", "Times Square", "Brooklyn Bridge", "Empire State Building"],
    "London": ["Big Ben", "London Eye", "Tower of London", "Buckingham Palace", "British Museum"],
    "Rome": ["Colosseum", "Vatican City", "Trevi Fountain", "Pantheon", "Roman Forum"],
    "Mecca": ["Masjid al-Haram", "Kaaba", "Mount Arafat", "Mina", "Jabal al-Nour"],
    "Medina": ["Al-Masjid an-Nabawi", "Quba Mosque", "Uhud Mountain", "Masjid al-Qiblatain", "Jannat al-Baqi"],
    "Istanbul": ["Hagia Sophia", "Blue Mosque", "Topkapi Palace", "Grand Bazaar", "Bosphorus Cruise"],
    "Cairo": ["Pyramids of Giza", "Egyptian Museum", "Khan El Khalili Bazaar", "Citadel of Saladin", "Al-Azhar Mosque"],
    "Turkey": ["Cappadocia", "Pamukkale", "Ephesus", "Antalya", "Bodrum"],
    "Dubai": ["Burj Khalifa", "Palm Jumeirah", "Dubai Mall", "Dubai Marina", "Desert Safari"],
    "Singapore": ["Marina Bay Sands", "Gardens by the Bay", "Sentosa", "Chinatown", "Little India"],
    "Seoul": ["Gyeongbokgung Palace", "Bukchon Hanok Village", "Myeongdong", "N Seoul Tower", "Hongdae"],
    "Korea": ["Gyeongbokgung Palace", "Bukchon Hanok Village", "Myeongdong", "Jeju Island", "Busan Haeundae"],
}


def calculate_daily_budget(budget: float, days: int) -> float:
    """Daily budget = budget / days (guards against division by zero)."""
    if days <= 0:
        raise ValueError("days must be greater than 0")
    return round(budget / days, 2)


def get_trip_category(budget: float) -> str:
    """Session 2 business rules, based on the total trip budget."""
    if budget < 1000:
        return "Backpacker"
    elif budget <= 3000:
        return "Standard"
    else:
        return "Luxury"


def get_recommended_transportation(category: str) -> str:
    """Session 2 challenge: map trip category to transportation."""
    if category == "Backpacker":
        return "Bus"
    elif category == "Standard":
        return "Train"
    elif category == "Luxury":
        return "Flight"
    return "Unknown"


def normalize_month(month: str | int | None) -> str | None:
    """Accept "december", "Dec" or 12 and return "December"."""
    if month is None or month == "":
        return None
    if isinstance(month, int) or str(month).strip().isdigit():
        number = int(month)
        return MONTHS[number - 1] if 1 <= number <= 12 else None
    text = str(month).strip().lower()
    for name in MONTHS:
        if name.lower() == text or name.lower()[:3] == text[:3]:
            return name
    return None


def get_travel_season(month: str | int | None) -> str:
    """Session 2 homework: December = Peak, June = Holiday, others = Regular."""
    name = normalize_month(month)
    if name == "December":
        return "Peak Season"
    elif name == "June":
        return "Holiday Season"
    else:
        return "Regular Season"


def get_recommended_places(destination: str) -> list[str]:
    key = destination.strip().title()
    return RECOMMENDED_PLACES.get(key, [])


def build_trip_plan(budget: float, days: int, travel_month: str | int | None = None) -> dict:
    """Run every rule at once — used by the API on create and update."""
    category = get_trip_category(budget)
    return {
        "category": category,
        "daily_budget": calculate_daily_budget(budget, days),
        "recommended_transport": get_recommended_transportation(category),
        "season": get_travel_season(travel_month) if travel_month else None,
    }
