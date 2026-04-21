from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)
CORS(app)

# 🍽️ Dish dataset with detailed features
dishes = pd.DataFrame([
    # Italian
    {"name": "Pasta",           "category": "italian",   "spicy": 0.1, "sweet": 0.0, "healthy": 0.4, "heavy": 0.7, "veg": 1},
    {"name": "Pizza",           "category": "italian",   "spicy": 0.3, "sweet": 0.0, "healthy": 0.2, "heavy": 0.8, "veg": 1},
    {"name": "Risotto",         "category": "italian",   "spicy": 0.1, "sweet": 0.0, "healthy": 0.4, "heavy": 0.6, "veg": 1},

    # Sweets
    {"name": "Gulab Jamun",     "category": "sweets",    "spicy": 0.0, "sweet": 1.0, "healthy": 0.1, "heavy": 0.6, "veg": 1},
    {"name": "Rasgulla",        "category": "sweets",    "spicy": 0.0, "sweet": 0.9, "healthy": 0.2, "heavy": 0.4, "veg": 1},
    {"name": "Brownie",         "category": "sweets",    "spicy": 0.0, "sweet": 0.95,"healthy": 0.1, "heavy": 0.5, "veg": 1},
    {"name": "Ice Cream",       "category": "sweets",    "spicy": 0.0, "sweet": 0.9, "healthy": 0.1, "heavy": 0.3, "veg": 1},

    # Drinks
    {"name": "Mango Juice",     "category": "drinks",    "spicy": 0.0, "sweet": 0.8, "healthy": 0.6, "heavy": 0.1, "veg": 1},
    {"name": "Green Smoothie",  "category": "drinks",    "spicy": 0.0, "sweet": 0.3, "healthy": 0.9, "heavy": 0.1, "veg": 1},
    {"name": "Masala Chai",     "category": "drinks",    "spicy": 0.5, "sweet": 0.4, "healthy": 0.5, "heavy": 0.1, "veg": 1},
    {"name": "Cold Coffee",     "category": "drinks",    "spicy": 0.0, "sweet": 0.7, "healthy": 0.3, "heavy": 0.2, "veg": 1},

    # Home Meals
    {"name": "Dal Rice",        "category": "homemeals", "spicy": 0.3, "sweet": 0.0, "healthy": 0.8, "heavy": 0.5, "veg": 1},
    {"name": "Biryani",         "category": "homemeals", "spicy": 0.8, "sweet": 0.0, "healthy": 0.3, "heavy": 0.9, "veg": 0},
    {"name": "Curd Rice",       "category": "homemeals", "spicy": 0.1, "sweet": 0.2, "healthy": 0.7, "heavy": 0.4, "veg": 1},
    {"name": "Chicken Curry",   "category": "homemeals", "spicy": 0.8, "sweet": 0.0, "healthy": 0.4, "heavy": 0.8, "veg": 0},

    # Healthy
    {"name": "Garden Salad",    "category": "healthy",   "spicy": 0.1, "sweet": 0.2, "healthy": 1.0, "heavy": 0.1, "veg": 1},
    {"name": "Grilled Chicken", "category": "healthy",   "spicy": 0.4, "sweet": 0.0, "healthy": 0.8, "heavy": 0.5, "veg": 0},
    {"name": "Fruit Bowl",      "category": "healthy",   "spicy": 0.0, "sweet": 0.7, "healthy": 0.9, "heavy": 0.1, "veg": 1},
    {"name": "Oats Bowl",       "category": "healthy",   "spicy": 0.0, "sweet": 0.3, "healthy": 0.9, "heavy": 0.3, "veg": 1},
])

# Scale features
feature_cols = ["spicy", "sweet", "healthy", "heavy", "veg"]
scaler = MinMaxScaler()
scaled_features = scaler.fit_transform(dishes[feature_cols])

# Train KNN model
model = NearestNeighbors(n_neighbors=5, metric="euclidean")
model.fit(scaled_features)

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json

    spicy   = float(data.get("spicy",   0.5))
    sweet   = float(data.get("sweet",   0.5))
    healthy = float(data.get("healthy", 0.5))
    heavy   = float(data.get("heavy",   0.5))
    veg     = float(data.get("veg",     1.0))  # 1 = veg, 0 = non-veg

    user_prefs = np.array([[spicy, sweet, healthy, heavy, veg]])
    scaled_prefs = scaler.transform(user_prefs)

    distances, indices = model.kneighbors(scaled_prefs)

    recommended = []
    for i, idx in enumerate(indices[0]):
        dish = dishes.iloc[idx]
        recommended.append({
            "name":     dish["name"],
            "category": dish["category"],
            "veg":      bool(dish["veg"]),
            "match":    round((1 - distances[0][i]) * 100, 1)  # match %
        })

    return jsonify({"recommendations": recommended})

if __name__ == "__main__":
    print("🍽️ ML Server running on port 5001")
    app.run(port=5001, debug=True)