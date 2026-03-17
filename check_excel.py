import pandas as pd
import sys

try:
    df = pd.read_excel(r'c:\web-project\유입율.xlsx')
    print("Columns:", df.columns.tolist())
    print("Head:\n", df.head(5))
except Exception as e:
    print(f"Error: {e}")
