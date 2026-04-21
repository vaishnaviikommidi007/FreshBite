from flask import Flask, jsonify, request, Blueprint
from db import get_db
from datetime import datetime

app = Flask(__name__)
orders_bp = Blueprint("orders", __name__)

# ──────────────────────────────────────────────
# SAVE ORDER
# ──────────────────────────────────────────────
@orders_bp.route("/api/orders/save", methods=["POST"])
def save_order():
    print("✅ SAVE ORDER API HIT")

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No data received"}), 400

        user_id = data.get("user_id")
        total_amount = data.get("total_amount")

        if not user_id or not total_amount:
            return jsonify({
                "success": False,
                "error": "user_id or total_amount missing"
            }), 400

        # ✅ Insert order with all columns
        cursor.execute("""
            INSERT INTO orders_new (
                user_id, subtotal, gst, delivery_fee, total_amount,
                distance_km, delivery_address, custom_note, payment_method,
                pickup_lat, pickup_lng, pickup_area, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'confirmed')
        """, (
            user_id,
            data.get("subtotal"),
            data.get("gst"),
            data.get("delivery_fee"),
            data.get("total_amount"),
            data.get("distance_km"),
            data.get("delivery_address"),
            data.get("custom_note"),
            data.get("payment_method"),
            data.get("pickup_lat"),
            data.get("pickup_lng"),
            data.get("pickup_area"),
        ))

        order_id = cursor.lastrowid

        # ✅ Insert items
        items = data.get("items", [])
        if items:
            for item in items:
                cursor.execute("""
                    INSERT INTO order_items (order_id, item_name, quantity, price)
                    VALUES (%s, %s, %s, %s)
                """, (
                    order_id,
                    item.get("name"),
                    item.get("quantity"),
                    item.get("price")
                ))

        # ✅ Insert event
        cursor.execute("""
            INSERT INTO order_events (order_id, message)
            VALUES (%s, %s)
        """, (order_id, "Order placed successfully"))

        conn.commit()

        return jsonify({"success": True, "order_id": order_id})

    except Exception as e:
        print("🔥 ERROR:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────
# TRACKING
# ──────────────────────────────────────────────
@orders_bp.route("/api/orders/<int:order_id>/tracking", methods=["GET"])
def get_tracking(order_id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM orders_new WHERE id = %s", (order_id,))
        order = cursor.fetchone()

        if not order:
            return jsonify({"success": False, "error": "Order not found"}), 404

        cursor.execute("""
            SELECT message, created_at 
            FROM order_events 
            WHERE order_id = %s
            ORDER BY id ASC
        """, (order_id,))

        events_raw = cursor.fetchall()

        events = []
        for ev in events_raw:
            try:
                created = datetime.fromisoformat(str(ev["created_at"]))
            except:
                created = datetime.strptime(str(ev["created_at"]), "%Y-%m-%d %H:%M:%S")

            delta = datetime.utcnow() - created

            if delta.total_seconds() < 60:
                label = "Just now"
            elif delta.total_seconds() < 3600:
                label = f"{int(delta.total_seconds()//60)} min ago"
            else:
                label = created.strftime("%H:%M")

            events.append({
                "message": ev["message"],
                "time_label": label
            })

        return jsonify({
            "success": True,
            "order": order,
            "status": order.get("status"),
            "eta_minutes": 20,
            "cook": None,
            "rider": None,
            "events": events
        })

    except Exception as e:
        print("🔥 TRACKING ERROR:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────
# ADVANCE STATUS
# ──────────────────────────────────────────────
@orders_bp.route("/api/orders/<int:order_id>/advance-status", methods=["POST"])
def advance_status(order_id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM orders_new WHERE id = %s", (order_id,))
        order = cursor.fetchone()

        if not order:
            return jsonify({"success": False, "error": "Order not found"}), 404

        flow = {
            "confirmed": "preparing",
            "preparing": "out_for_delivery",
            "out_for_delivery": "delivered"
        }

        new_status = flow.get(order["status"])

        if not new_status:
            return jsonify({"success": False, "error": "Already delivered"}), 400

        cursor.execute(
            "UPDATE orders_new SET status = %s WHERE id = %s",
            (new_status, order_id)
        )

        cursor.execute("""
            INSERT INTO order_events (order_id, message)
            VALUES (%s, %s)
        """, (order_id, f"Order is now {new_status}"))

        conn.commit()

        return jsonify({"success": True, "new_status": new_status})

    except Exception as e:
        print("🔥 STATUS ERROR:", str(e))
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if conn:
            conn.close()


# ──────────────────────────────────────────────
# REGISTER
# ──────────────────────────────────────────────
app.register_blueprint(orders_bp)

if __name__ == "__main__":
    app.run(debug=True)