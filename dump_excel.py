import openpyxl
import os

filepath = r'c:\web-project\유입율.xlsx'
if os.path.exists(filepath):
    try:
        wb = openpyxl.load_workbook(filepath, data_only=True)
        sheet = wb.active
        print(f"Sheet Name: {sheet.title}")
        for row in sheet.iter_rows(min_row=1, max_row=5):
            print([cell.value for cell in row])
    except Exception as e:
        print(f"Error: {e}")
else:
    print("File not found")
