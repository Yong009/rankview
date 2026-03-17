import pandas as pd
import sys

try:
    # Read without header to see raw indexes
    df = pd.read_excel(r'c:\web-project\유입율.xlsx', header=None)
    print("Raw Data (First 5 rows):")
    print(df.head(5).to_string())
except Exception as e:
    print(f"Error: {e}")
