import os
import mysql.connector


def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "root"),
        database=os.getenv("DB_NAME", "fresh_bite"),  # set to your actual DB name
        port=int(os.getenv("DB_PORT", 3306)),
    )
