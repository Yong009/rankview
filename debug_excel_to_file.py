import pandas as pd
import sys

try:
    df = pd.read_excel(r'c:\web-project\유입율.xlsx', header=None)
    with open(r'c:\web-project\excel_debug.txt', 'w', encoding='utf-8') as f:
        f.write("Raw Data (First 10 rows):\n")
        f.write(df.head(10).to_string())
        f.write("\nColumns:\n")
        f.write(str(df.columns.tolist()))
except Exception as e:
    with open(r'c:\web-project\excel_debug.txt', 'w', encoding='utf-8') as f:
        f.write(f"Error: {e}")
