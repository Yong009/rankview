// Default State & Data Structure
let folders = [
  { id: 'f-1', name: '기본 폴더' },
  { id: 'f-2', name: '가전제품' },
  { id: 'f-3', name: '생활용품' }
];

let activeFolderId = 'f-1';

// Sample Keywords Data
// folderId links keyword to its respective folder
let keywords = [
  { 
    id: 'k-1', folderId: 'f-1', keyword: '세제', mid: '87495077064', 
    catalogMid: '', storeName: '스토어A', memo: '기본상품', 
    link: '상품주소', targetRank: '업데이트 필요', yesterdayRank: '-', 
    change: 0 
  },
  { 
    id: 'k-2', folderId: 'f-2', keyword: '무선 이어폰', mid: '12345678', 
    catalogMid: '112233', storeName: '가전스토어', memo: '이벤트중', 
    link: '상품상세', targetRank: '5', yesterdayRank: '8', 
    change: 3 
  }
];

// DOM Elements
const folderListEl = document.getElementById('folderList');
const currentFolderNameEl = document.getElementById('currentFolderName');
const itemCountEl = document.getElementById('itemCount');
const keywordTableBody = document.getElementById('keywordTableBody');
const emptyStateEl = document.getElementById('emptyState');
const modalFolderNameEl = document.getElementById('modalFolderName');
const searchInput = document.getElementById('searchInput');

// Modal Elements
const folderModal = document.getElementById('folderModal');
const productModal = document.getElementById('productModal');
const toastEl = document.getElementById('toast');

// Buttons
const addFolderBtn = document.getElementById('addFolderBtn');
const saveFolderBtn = document.getElementById('saveFolderBtn');
const addProductBtn = document.getElementById('addProductBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const selectAllCheckbox = document.getElementById('selectAll');

// Initialize App
function initApp() {
  renderFolders();
  renderKeywords();
  setupEventListeners();
}

// -------------------------------------------------------------
// Core Rendering logic
// -------------------------------------------------------------

function renderFolders() {
  folderListEl.innerHTML = '';
  
  folders.forEach(folder => {
    // Count items in this folder
    const count = keywords.filter(k => k.folderId === folder.id).length;
    
    const li = document.createElement('li');
    li.className = `folder-item ${folder.id === activeFolderId ? 'active' : ''}`;
    li.dataset.id = folder.id;
    li.innerHTML = `
      <i class="fas ${folder.id === activeFolderId ? 'fa-folder-open' : 'fa-folder'}"></i>
      <span class="folder-name">${folder.name}</span>
      <span class="folder-count">${count}</span>
    `;
    
    // Select Folder on Click
    li.addEventListener('click', () => {
      activeFolderId = folder.id;
      // Re-render
      renderFolders();
      renderKeywords();
      clearSearch();
    });
    
    folderListEl.appendChild(li);
  });
  
  // Update Current Folder info on main panel
  const activeFolder = folders.find(f => f.id === activeFolderId);
  if(activeFolder) {
    currentFolderNameEl.textContent = activeFolder.name;
    modalFolderNameEl.textContent = activeFolder.name;
  }
}

function renderKeywords(searchString = '') {
  let filteredKeywords = keywords.filter(k => k.folderId === activeFolderId);
  
  // Filter by search string if exists
  if(searchString) {
    const lowerSearch = searchString.toLowerCase();
    filteredKeywords = filteredKeywords.filter(k => 
      k.mid.toLowerCase().includes(lowerSearch) || 
      k.storeName.toLowerCase().includes(lowerSearch) || 
      k.memo.toLowerCase().includes(lowerSearch) ||
      k.keyword.toLowerCase().includes(lowerSearch)
    );
  }

  itemCountEl.textContent = filteredKeywords.length;
  keywordTableBody.innerHTML = '';
  selectAllCheckbox.checked = false;

  if (filteredKeywords.length === 0) {
    emptyStateEl.style.display = 'block';
  } else {
    emptyStateEl.style.display = 'none';
    filteredKeywords.forEach(k => {
      const tr = document.createElement('tr');
      
      // Calculate rank HTML
      let rankHtml = '';
      if(k.change > 0) {
         rankHtml = `<span class="tag-up"><i class="fas fa-caret-up"></i> ${k.change}</span>`;
      } else if (k.change < 0) {
         rankHtml = `<span class="tag-down"><i class="fas fa-caret-down"></i> ${Math.abs(k.change)}</span>`;
      } else {
         rankHtml = `<span style="color:#94a3b8">-</span>`;
      }

      tr.innerHTML = `
        <td><input type="checkbox" class="row-checkbox" data-id="${k.id}"></td>
        <td style="font-weight:500;">${k.keyword}</td>
        <td>${k.mid}</td>
        <td>${k.catalogMid || '-'}</td>
        <td>${k.storeName || '-'}</td>
        <td style="color:#64748b">${k.memo || '-'}</td>
        <td><a href="#" class="action-link">${k.link}</a></td>
        <td style="font-weight:600">${k.targetRank}</td>
        <td>${k.yesterdayRank}</td>
        <td>${rankHtml}</td>
        <td><button class="btn-check-rank" data-id="${k.id}"><i class="fas fa-sync-alt" style="color:var(--primary)"></i></button></td>
        <td><button class="btn-delete-row" data-id="${k.id}"><i class="fas fa-trash"></i></button></td>
      `;
      keywordTableBody.appendChild(tr);
    });
  }

  // Bind single delete events
  document.querySelectorAll('.btn-delete-row').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      deleteKeyword(id);
    });
  });
}

// -------------------------------------------------------------
// Logic Features
// -------------------------------------------------------------

function addFolder(name) {
  const newId = 'f-' + Date.now();
  folders.push({ id: newId, name });
  activeFolderId = newId; // Select the newly created folder automatically
  renderFolders();
  renderKeywords();
  showToast(`'${name}' 폴더가 생성되었습니다.`);
}

function addProduct(data) {
  const newProduct = {
    id: 'k-' + Date.now(),
    folderId: activeFolderId, // Save specifically to active folder
    keyword: data.keyword,
    mid: data.mid,
    catalogMid: data.catalogMid,
    storeName: data.storeName,
    memo: data.memo,
    link: data.link || '상품주소',
    targetRank: '확인중',
    yesterdayRank: '-',
    change: 0
  };
  keywords.unshift(newProduct);
  renderFolders(); // Update counts
  renderKeywords();
  showToast(`신규 상품이 '${currentFolderNameEl.textContent}' 폴더에 등록되었습니다.`);
}

function deleteKeyword(id) {
  keywords = keywords.filter(k => k.id !== id);
  renderFolders(); // Update counts
  renderKeywords();
  showToast('항목이 삭제되었습니다.');
}

function clearSearch() {
  searchInput.value = '';
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// -------------------------------------------------------------
// Modal & Event Bindings
// -------------------------------------------------------------

function setupEventListeners() {
  
  // Modals Open/Close
  addFolderBtn.addEventListener('click', () => {
    document.getElementById('newFolderName').value = '';
    folderModal.classList.add('active');
  });

  addProductBtn.addEventListener('click', () => {
    document.getElementById('productForm').reset();
    productModal.classList.add('active');
  });

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay').classList.remove('active');
    });
  });

  // Action Buttons inside Modals
  saveFolderBtn.addEventListener('click', () => {
    const input = document.getElementById('newFolderName').value.trim();
    if(input) {
      addFolder(input);
      folderModal.classList.remove('active');
    } else {
      alert("폴더 이름을 입력해주세요.");
    }
  });

  saveProductBtn.addEventListener('click', () => {
    const keyword = document.getElementById('pdKeyword').value.trim();
    const mid = document.getElementById('pdMid').value.trim();
    
    if(!keyword || !mid) {
      alert("필수 항목(*표시)을 입력해주세요.");
      return;
    }

    const data = {
      keyword,
      mid,
      catalogMid: document.getElementById('pdCatMid').value.trim(),
      storeName: document.getElementById('pdStore').value.trim(),
      link: document.getElementById('pdLink').value.trim(),
      memo: document.getElementById('pdMemo').value.trim()
    };
    
    addProduct(data);
    productModal.classList.remove('active');
  });

  // Checkbox Select All
  selectAllCheckbox.addEventListener('change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = checked;
    });
  });

  // Selected Delete (선택삭제)
  deleteSelectedBtn.addEventListener('click', () => {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
                             .map(cb => cb.dataset.id);
    if(selectedIds.length === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    
    if(confirm(`선택한 ${selectedIds.length}개 항목을 삭제하시겠습니까?`)) {
      keywords = keywords.filter(k => !selectedIds.includes(k.id));
      renderFolders();
      renderKeywords();
      showToast(`${selectedIds.length}개 항목이 삭제되었습니다.`);
    }
  });

  // Check Rank button (Prototype only)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-check-rank')) {
       const id = e.target.closest('.btn-check-rank').dataset.id;
       const k = keywords.find(item => item.id === id);
       showToast(`'${k.keyword}'의 네이버 가격비교 순위를 체크합니다...`);
       
       // Simulate rank update
       setTimeout(() => {
          k.yesterdayRank = k.targetRank;
          k.targetRank = Math.floor(Math.random() * 20) + 1;
          k.change = (k.yesterdayRank === '확인필요' || k.yesterdayRank === '-') ? 0 : parseInt(k.yesterdayRank) - k.targetRank;
          renderKeywords();
          showToast(`'${k.keyword}' 순위 체크 완료: ${k.targetRank}위`);
       }, 1500);
    }
  });

  // Search feature handling
  searchInput.addEventListener('input', (e) => {
    renderKeywords(e.target.value.trim());
  });
  
  // Initialize and Search btn
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    if(btn.textContent.includes('순위 새로고침')) {
      btn.addEventListener('click', () => {
        const folderKeywords = keywords.filter(k => k.folderId === activeFolderId);
        if (folderKeywords.length === 0) return;

        showToast("폴더 내 모든 키워드의 순위를 새로고침합니다 (최대 1000위 탐색)...");
        
        // Simulate mass update with 1000 rank logic
        folderKeywords.forEach(k => {
          k.yesterdayRank = k.targetRank;
          const randomVal = Math.floor(Math.random() * 1200) + 1; // 1200까지 생성
          if (randomVal > 1000) {
            k.targetRank = "순위 밖";
            k.change = 0;
          } else {
            k.targetRank = randomVal.toString();
            k.change = (k.yesterdayRank === '확인필요' || k.yesterdayRank === '-' || k.yesterdayRank === '순위 밖') 
                       ? 0 : parseInt(k.yesterdayRank) - randomVal;
          }
        });
        
        setTimeout(() => {
          renderKeywords();
          showToast("전체 순위 새로고침 완료 (1000위 이내 결과 반영)");
        }, 1500);
      });
    }
    if(btn.textContent === '검색' || btn.textContent === '검색하기') {
      btn.addEventListener('click', () => renderKeywords(searchInput.value.trim()));
    }
    if(btn.textContent === '초기화') {
      btn.addEventListener('click', () => {
        clearSearch();
        renderKeywords();
      });
    }
  });
}

// Start application
initApp();
