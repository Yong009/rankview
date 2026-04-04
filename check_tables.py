import sqlite3

def check_sqlite_schema():
    conn = sqlite3.connect('rankview.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Detected Tables in SQLite (rankview.db):")
    for table in tables:
        print(f" - {table[0]}")
    conn.close()

if __name__ == "__main__":
    check_sqlite_schema()
