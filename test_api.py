import requests
import json

# 테스트용 기본 설정
BASE_URL = "http://localhost:8088/api"
SESSION = requests.Session()

def test_login_simulation():
    """로그인 세션 시뮬레이션 (AdminController 등을 위해)"""
    print("\n--- 1. 로그인 세션 확인 ---")
    # 실제 로그인 API가 있다면 호출해야 하지만, 여기서는 세션 유지가 필요함을 알림
    print("주의: 서버가 실행 중이어야 하며, 세션 정보가 필요할 수 있습니다.")

def test_folder_api():
    """폴더 API 테스트"""
    print("\n--- 2. 폴더 API 테스트 ---")
    try:
        # 폴더 목록 조회
        response = SESSION.get(f"{BASE_URL}/folders")
        print(f"GET /folders: {response.status_code}")
        if response.status_code == 200:
            print(f"Folders: {response.json()}")
            
        # 새 폴더 생성
        new_folder = {"name": "API 테스트 폴더"}
        response = SESSION.post(f"{BASE_URL}/folders", json=new_folder)
        print(f"POST /folders: {response.status_code}")
        if response.status_code == 200:
            folder_data = response.json()
            print(f"Created Folder: {folder_data}")
            return folder_data.get('id')
    except Exception as e:
        print(f"Error: {e}")
    return None

def test_keyword_api(folder_id):
    """키워드 API 테스트"""
    if not folder_id:
        return
    
    print("\n--- 3. 키워드 API 테스트 ---")
    try:
        # 키워드 등록
        new_keyword = {
            "keyword": "테스트 키워드",
            "mid": "999999999",
            "folderId": folder_id,
            "dataType": "RANK"
        }
        response = SESSION.post(f"{BASE_URL}/keywords", json=new_keyword)
        print(f"POST /keywords: {response.status_code}")
        if response.status_code == 200:
            print(f"Created Keyword: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("RankView API 통합 테스트 시작...")
    test_login_simulation()
    f_id = test_folder_api()
    test_keyword_api(f_id)
    print("\n테스트 종료.")
