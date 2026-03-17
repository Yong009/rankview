// Default State & Data Structure
let folders = [
  { id: 'f-1', name: '기본 폴더', parentId: null },
  { id: 'f-2', name: '반지', parentId: null },
  { id: 'f-2-1', name: '90499240382', parentId: 'f-2' },
  { id: 'f-2-2', name: '90499240383', parentId: 'f-2' },
  { id: 'f-3', name: '목걸이', parentId: null },
  { id: 'f-3-1', name: '12211230552', parentId: 'f-3' },
  { id: 'f-4', name: '귀걸이', parentId: null },
  { id: 'f-4-1', name: '9439861879', parentId: 'f-4' }
];

let expandedFolders = new Set(['f-2', 'f-3', 'f-4']); // 기본적으로 확장될 폴더들
let activeFolderId = 'all'; // Default to show everything
let isEventListenersSetup = false; 

// Sample Keywords Data with History View Support
let keywords = [
  { 
    id: 'k-1', folderId: 'f-2-1', keyword: '14K 물고기 반지 (90499240382)', mid: '90499240382', 
    price: '158,000', 
    imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3f41e?w=100&h=100&fit=crop',
    history: { '1': '10', '4': '7', '5': '7', '10': '5' },
    highlight: true
  },
  { 
    id: 'k-2', folderId: 'f-2-2', keyword: '18K 심플 실반지 (90499240383)', mid: '90499240383', 
    price: '89,000', 
    imageUrl: 'https://images.unsplash.com/photo-1627225924765-552d44cfbc72?w=100&h=100&fit=crop',
    history: { '3': '15', '4': '12', '5': '9', '6': '8' }
  },
  { 
    id: 'k-3', folderId: 'f-2-1', keyword: '레이어드 가드링 (90499240382)', mid: '90499240382', 
    price: '120,000', 
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31d85?w=100&h=100&fit=crop',
    history: { '5': '20', '6': '18', '7': '15' }
  },
  { 
    id: 'k-4', folderId: 'f-3-1', keyword: '다이아 루이 목걸이 (12211230552)', mid: '12211230552', 
    price: '345,000', 
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100&h=100&fit=crop',
    history: { '1': '2', '2': '1', '5': '1' }
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
  try {
    // Ensure DOM is ready and listeners are attached before rendering
    setupEventListeners();
    renderFolders();
    renderKeywords();
  } catch (e) {
    console.error("App initialization failed:", e);
  }
}

// Ensure startup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// -------------------------------------------------------------
// Core Rendering logic
// -------------------------------------------------------------

function renderFolders() {
  folderListEl.innerHTML = '';
  
  // Add global dashboard item
  const allItem = document.createElement('li');
  allItem.className = `folder-item global ${activeFolderId === 'all' ? 'active' : ''}`;
  allItem.dataset.id = 'all'; // Essential for delegation
  allItem.innerHTML = `<i class="fas fa-th-large"></i> <span class="folder-name">전체 대시보드</span>`;
  folderListEl.appendChild(allItem);

  // Render root folders
  const rootFolders = folders.filter(f => !f.parentId);
  rootFolders.forEach(folder => {
    renderFolderItem(folder, 0);
  });

  // Update Current Folder info on main panel
  if (activeFolderId === 'all') {
    currentFolderNameEl.innerHTML = '<span class="path-current">전체 대시보드</span>';
    modalFolderNameEl.textContent = '전체 대시보드';
  } else {
    const activeFolder = folders.find(f => f.id === activeFolderId);
    if(activeFolder) {
      const path = getFolderPath(activeFolderId);
      currentFolderNameEl.innerHTML = path;
      modalFolderNameEl.textContent = activeFolder.name;
    }
  }
}

function renderApp() {
  renderFolders();
  renderKeywords();
  clearSearch();
}

function getFolderPath(folderId) {
  let current = folders.find(f => f.id === folderId);
  let path = [`${current.name}`];
  
  while (current && current.parentId) {
    current = folders.find(f => f.id === current.parentId);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.map((name, i) => 
    i === path.length - 1 ? `<span class="path-current">${name}</span>` : `<span class="path-parent">${name}</span>`
  ).join(' <i class="fas fa-chevron-right" style="font-size: 0.7rem; margin: 0 4px; opacity: 0.5;"></i> ');
}

function renderFolderItem(folder, depth) {
  const isParent = folders.some(f => f.parentId === folder.id);
  const isExpanded = expandedFolders.has(folder.id);
  const isActive = folder.id === activeFolderId;
  
  // Count items (including children if it's a parent)
  const allFolderIds = isParent ? getAllChildFolderIds(folder.id) : [folder.id];
  const count = keywords.filter(k => allFolderIds.includes(k.folderId)).length;
  
  const li = document.createElement('li');
  li.className = `folder-item ${isActive ? 'active' : ''} ${depth > 0 ? 'child' : ''} ${isExpanded ? 'expanded' : ''}`;
  li.dataset.id = folder.id;
  
  let toggleBtn = isParent ? `<i class="fas fa-chevron-right toggle-icon"></i>` : '';
  let folderIcon = isActive ? (isParent ? 'fa-folder-open' : 'fa-folder-open') : (isParent ? 'fa-folder' : 'fa-folder');
  
  li.innerHTML = `
    ${toggleBtn}
    <i class="fas ${folderIcon}"></i>
    <span class="folder-name">${folder.name}</span>
    <span class="folder-count">${count}</span>
  `;
  
  folderListEl.appendChild(li);
  
  // Render Children if expanded
  if (isParent && isExpanded) {
    const children = folders.filter(f => String(f.parentId) === String(folder.id));
    children.forEach(child => renderFolderItem(child, depth + 1));
  }
}

function toggleFolder(id) {
  if (expandedFolders.has(id)) {
    expandedFolders.delete(id);
  } else {
    expandedFolders.add(id);
  }
  renderFolders();
}

// Delegation for Folder Clicks
function handleFolderClick(e) {
  const li = e.target.closest('.folder-item');
  if (!li) return;
  
  const id = li.dataset.id;
  if (!id) return;

  // Toggle icon logic
  if (e.target.classList.contains('toggle-icon')) {
    e.stopPropagation();
    toggleFolder(id);
    return;
  }

  activeFolderId = id;
  renderApp();
}

function getAllChildFolderIds(parentId) {
  let ids = [parentId];
  const children = folders.filter(f => String(f.parentId) === String(parentId));
  children.forEach(child => {
    ids = ids.concat(getAllChildFolderIds(child.id));
  });
  return ids;
}

function renderKeywords(searchString = '') {
  let filteredKeywords = [];
  
  if (activeFolderId === 'all') {
    filteredKeywords = [...keywords];
  } else {
    // Get all relevant folder IDs (self + all descendants)
    const targetIds = getAllChildFolderIds(activeFolderId);
    filteredKeywords = keywords.filter(k => targetIds.includes(k.folderId));
  }
  
  // Dynamic Header Generation (Last Month 3 Days + Current Month)
  const headerRow = document.getElementById('tableHeaderDates');
  headerRow.innerHTML = `
    <th width="60">이미지</th>
    <th width="200">상품정보 / MID</th>
  `;
  
  // Just show 1 to 31 for demo (simplified date picker later)
  for (let i = 1; i <= 31; i++) {
    const th = document.createElement('th');
    th.className = 'cell-daily';
    th.textContent = `${i}일`;
    headerRow.appendChild(th);
  }

  itemCountEl.textContent = filteredKeywords.length;
  keywordTableBody.innerHTML = '';

  if (filteredKeywords.length === 0) {
    emptyStateEl.style.display = 'block';
  } else {
    emptyStateEl.style.display = 'none';
    filteredKeywords.forEach(k => {
      const tr = document.createElement('tr');
      
      let columnsHtml = `
        <td style="text-align:center;">
          <img src="${k.imageUrl || 'https://via.placeholder.com/50'}" class="cell-image">
        </td>
        <td class="${k.highlight ? 'cell-highlight-yellow' : ''}">
          <div class="cell-product-info">
            <span class="cell-product-id">${k.mid}</span>
            <span class="cell-product-name">${k.keyword}</span>
            <span class="cell-product-id" style="color:var(--primary)">${k.price || '0'}원</span>
          </div>
        </td>
      `;

      // Render 31 day cells
      for (let i = 1; i <= 31; i++) {
        const value = k.history && k.history[i] ? k.history[i] : '';
        const isSelected = (i === 5); // Just highlight "today" for demo
        columnsHtml += `<td class="cell-daily ${isSelected ? 'cell-highlight-yellow' : ''}">${value}</td>`;
      }

      tr.innerHTML = columnsHtml;
      keywordTableBody.appendChild(tr);
    });
  }
}

// -------------------------------------------------------------
// Logic Features
// -------------------------------------------------------------

function addFolder(name) {
  const newId = 'f-' + Date.now();
  // If active folder is a root category, add as child. Otherwise add to root.
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const parentId = (activeFolder && !activeFolder.parentId) ? activeFolder.id : null;
  
  folders.push({ id: newId, name, parentId });
  
  if (parentId) {
    expandedFolders.add(parentId); // Automatically expand parent
  }
  
  activeFolderId = newId; 
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
  // Prevent duplicate listeners
  if (isEventListenersSetup) return;
  isEventListenersSetup = true;

  // Safe helper to add listeners
  const safeAddListener = (id, event, callback) => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener(event, callback); // Clean update if somehow called
      el.addEventListener(event, callback);
    }
  };

  // Logo click triggers All Dashboard
  const logo = document.querySelector('.sidebar-logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      activeFolderId = 'all';
      renderApp();
    });
  }

  // Delegation on Folder List
  safeAddListener('folderList', 'click', handleFolderClick);

  // Modals Open/Close
  safeAddListener('addFolderBtn', 'click', () => {
    const input = document.getElementById('newFolderName');
    if (input) input.value = '';
    const modal = document.getElementById('folderModal');
    if (modal) modal.classList.add('active');
  });

  safeAddListener('addProductBtn', 'click', () => {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('active');
  });

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // Action Buttons inside Modals
  safeAddListener('saveFolderBtn', 'click', () => {
    const inputEl = document.getElementById('newFolderName');
    const input = inputEl ? inputEl.value.trim() : '';
    if(input) {
      addFolder(input);
      const modal = document.getElementById('folderModal');
      if (modal) modal.classList.remove('active');
    } else {
      alert("폴더 이름을 입력해주세요.");
    }
  });

  safeAddListener('saveProductBtn', 'click', () => {
    const keywordEl = document.getElementById('pdKeyword');
    const midEl = document.getElementById('pdMid');
    const keyword = keywordEl ? keywordEl.value.trim() : '';
    const mid = midEl ? midEl.value.trim() : '';
    
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
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
  });

  // Checkbox Select All
  safeAddListener('selectAll', 'change', (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = checked;
    });
  });

  // Selected Delete (선택삭제)
  safeAddListener('deleteSelectedBtn', 'click', () => {
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
  safeAddListener('searchInput', 'input', (e) => {
    renderKeywords(e.target.value.trim());
  });
  
  // Initialize and Search btn
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    const text = btn.textContent.trim();
    
    if(text.includes('순위 새로고침')) {
      btn.addEventListener('click', () => {
        const activeFolder = folders.find(f => f.id === activeFolderId);
        const isParent = folders.some(f => f.parentId === activeFolderId);
        const allTargetFolderIds = isParent ? getAllChildFolderIds(activeFolderId) : [activeFolderId];
        const folderKeywords = keywords.filter(k => allTargetFolderIds.includes(k.folderId));
        
        if (folderKeywords.length === 0) {
          showToast("업데이트할 키워드가 없습니다.");
          return;
        }

        showToast(`${activeFolder.name} 카테고리의 모든 순위를 새로고침합니다...`);
        
        folderKeywords.forEach(k => {
          k.yesterdayRank = k.targetRank;
          const randomVal = (Math.random() * 50).toFixed(1);
          k.targetRank = randomVal;
          k.change = (k.yesterdayRank === '-') ? 0 : (parseFloat(k.yesterdayRank) - parseFloat(randomVal)).toFixed(1);
        });
        
        setTimeout(() => {
          renderKeywords();
          showToast("전체 순위 새로고침 완료");
        }, 1200);
      });
    }
    
    if(text.includes('엑셀 업로드')) {
      btn.addEventListener('click', () => {
        showToast("엑셀 파일을 분석 중입니다...");
        setTimeout(() => {
          showToast("엑셀 업로드 완료: 7개의 새로운 키워드가 추가되었습니다.");
          // 더미 데이터 추가 시뮬레이션
          addFolder("엑셀_수집_데이터");
        }, 1500);
      });
    }

    if(text === '검색' || text === '검색하기') {
      btn.addEventListener('click', () => renderKeywords(searchInput.value.trim()));
    }
    if(text === '초기화') {
      btn.addEventListener('click', () => {
        clearSearch();
        renderKeywords();
      });
    }
  });
}

// Application Start handled by DOMContentLoaded listener at the top
