import sqlite3

def update_db():
    conn = sqlite3.connect('rankview.db')
    cursor = conn.cursor()
    
    # Update keyword_rank table
    try:
        cursor.execute("ALTER TABLE keyword_rank ADD COLUMN price INTEGER DEFAULT 0")
        print("Added 'price' column to keyword_rank")
    except sqlite3.OperationalError as e:
        print(f"price column: {e}")

    try:
        cursor.execute("ALTER TABLE keyword_rank ADD COLUMN image_url TEXT")
        print("Added 'image_url' column to keyword_rank")
    except sqlite3.OperationalError as e:
        print(f"image_url column: {e}")

    # Create keyword_daily_data table if not exists
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS keyword_daily_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword_id INTEGER,
                date TEXT,
                inflow_count INTEGER DEFAULT 0,
                daily_memo TEXT,
                FOREIGN KEY (keyword_id) REFERENCES keyword_rank(id)
            )
        """)
        print("Created keyword_daily_data table")
    except Exception as e:
        print(f"keyword_daily_data table: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    update_db()
