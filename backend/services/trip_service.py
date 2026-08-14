def calculate_daily_budget(budget, days):
    return budget / days

def get_trip_category(daily_budget): #menurut saya lebih tepat kategori perjalanan ditentukan oleh budget per hari, bukan total budget
    if daily_budget < 200:
        return "Backpacker"
    elif daily_budget <= 600:
        return "Standard"
    else:
        return "Luxury"

def get_recommended_places(destination):
    recommendations = {
        "Bali": ["Ubud", "Kuta", "Seminyak", "Nusa Dua", "Uluwatu"],
        "Paris": ["Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral", "Montmartre", "Champs-Élysées"],
        "Tokyo": ["Tokyo Tower", "Shibuya Crossing", "Mount Fuji", "Senso-ji Temple", "Akihabara"],
        "New York": ["Statue of Liberty", "Central Park", "Times Square", "Brooklyn Bridge", "Empire State Building"],
        "London": ["Big Ben", "London Eye", "Tower of London", "Buckingham Palace", "British Museum"],
        "Rome": ["Colosseum", "Vatican City", "Trevi Fountain", "Pantheon", "Roman Forum"],
        "Mecca": ["Masjid al-Haram", "Kaaba", "Mount Arafat", "Mina", "Jabal al-Nour"],
        "Medina": ["Al-Masjid an-Nabawi", "Quba Mosque", "Uhud Mountain", "Masjid al-Qiblatain", "Jannat al-Baqi"],
        "Istanbul": ["Hagia Sophia", "Blue Mosque", "Topkapi Palace", "Grand Bazaar", "Bosphorus Cruise"],
        "Cairo": ["Pyramids of Giza", "Egyptian Museum", "Khan El Khalili Bazaar", "Citadel of Saladin", "Al-Azhar Mosque"],
        "Turkey": ["Cappadocia", "Pamukkale", "Ephesus", "Antalya", "Bodrum"],
        "Dubai": ["Burj Khalifa", "Palm Jumeirah", "Dubai Mall", "Dubai Marina", "Desert Safari"]
    }
    return recommendations.get(destination, ["No recommendations available for this destination."])

def get_recommended_transportation(category):
    if category == "Backpacker":
        return "Bus"
    elif category == "Standard":
        return "Train"
    elif category == "Luxury":
        return "Flight"
    return "Unknown"