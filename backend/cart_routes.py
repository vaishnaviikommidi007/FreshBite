# cart_routes.py  –  drop this file next to your app.py
# Register it with:  app.register_blueprint(cart_bp)

from flask import Blueprint, request, jsonify
from db import get_db_connection          # replace with your actual DB helper

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")

# ─────────────────────────────────────────────────────────────
# HELPER – fetch all cart rows for a user and return as list
# ─────────────────────────────────────────────────────────────
def _user_cart(conn, user_id):
    cur = conn.cursor(dictionary=True)
    cur.execute(
        """SELECT cart_id, food_id, name, price, quantity, image, category, added_at
           FROM cart WHERE user_id = %s ORDER BY added_at ASC""",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    return rows


# ─────────────────────────────────────────────────────────────
# GET  /api/cart/<user_id>   →  return user's full cart
# ─────────────────────────────────────────────────────────────
@cart_bp.route("/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    try:
        conn = get_db_connection()
        items = _user_cart(conn, user_id)
        conn.close()
        return jsonify({"success": True, "cart": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# POST /api/cart/add
# Body: { user_id, food_id, name, price, quantity, image?, category? }
# If the item already exists → quantity is INCREMENTED
# ─────────────────────────────────────────────────────────────
@cart_bp.route("/add", methods=["POST"])
def add_to_cart():
    data = request.get_json()
    required = ("user_id", "food_id", "name", "price", "quantity")
    if not all(k in data for k in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        # INSERT … ON DUPLICATE KEY UPDATE lets MySQL handle the upsert atomically
        cur.execute(
            """INSERT INTO cart (user_id, food_id, name, price, quantity, image, category)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE
                   quantity   = quantity + VALUES(quantity),
                   price      = VALUES(price),
                   updated_at = CURRENT_TIMESTAMP""",
            (
                data["user_id"], data["food_id"], data["name"],
                data["price"],   data["quantity"],
                data.get("image"), data.get("category"),
            )
        )
        conn.commit()
        items = _user_cart(conn, data["user_id"])
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Item added", "cart": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# PUT  /api/cart/update
# Body: { user_id, food_id, quantity }
# quantity = 0  →  item is removed automatically
# ─────────────────────────────────────────────────────────────
@cart_bp.route("/update", methods=["PUT"])
def update_cart():
    data = request.get_json()
    if not all(k in data for k in ("user_id", "food_id", "quantity")):
        return jsonify({"success": False, "error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        if int(data["quantity"]) <= 0:
            cur.execute(
                "DELETE FROM cart WHERE user_id=%s AND food_id=%s",
                (data["user_id"], data["food_id"])
            )
        else:
            cur.execute(
                """UPDATE cart SET quantity=%s, updated_at=CURRENT_TIMESTAMP
                   WHERE user_id=%s AND food_id=%s""",
                (data["quantity"], data["user_id"], data["food_id"])
            )

        conn.commit()
        items = _user_cart(conn, data["user_id"])
        cur.close(); conn.close()
        return jsonify({"success": True, "cart": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# DELETE /api/cart/remove
# Body: { user_id, food_id }
# ─────────────────────────────────────────────────────────────
@cart_bp.route("/remove", methods=["DELETE"])
def remove_from_cart():
    data = request.get_json()
    if not all(k in data for k in ("user_id", "food_id")):
        return jsonify({"success": False, "error": "Missing fields"}), 400

    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute(
            "DELETE FROM cart WHERE user_id=%s AND food_id=%s",
            (data["user_id"], data["food_id"])
        )
        conn.commit()
        items = _user_cart(conn, data["user_id"])
        cur.close(); conn.close()
        return jsonify({"success": True, "cart": items})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────
# DELETE /api/cart/clear/<user_id>
# Called after a successful order is placed
# ─────────────────────────────────────────────────────────────
@cart_bp.route("/clear/<int:user_id>", methods=["DELETE"])
def clear_cart(user_id):
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True, "message": "Cart cleared"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500