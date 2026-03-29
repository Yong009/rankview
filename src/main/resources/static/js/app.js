// Application Logic for RankView Folder System
let folders = [];
let keywords = [];
let activeFolderId = null;
let editingKeywordId = null;
let editingFolderId = null;
const expandedFolders = new Set();

// DOM Elements
const folderListEl = document.getElementById('folderList');
const currentFolderNameEl = document.getElementById('currentFolderName');
const itemCountEl = document.getElementById('itemCount');
const keywordTableBody = document.getElementById('keywordTableBody');
const emptyStateEl = document.getElementById('emptyState');
const modalFolderNameEl = document.getElementById('modalFolderName');
const searchInput = document.getElementById('searchInput');

// Initialize
async function init() {
  await loadFolders();
  bindEvents();
}

function toggleFolder(id) {
    if (expandedFolders.has(id)) {
        expandedFolders.delete(id);
    } else {
        expandedFolders.add(id);
    }
    renderFolders();
}

window.toggleFolder = toggleFolder;

async function updateFolderRanks(folderId) {
    if (!confirm(folderId === null ? '전체 키워드의 순위 조회를 시작하시겠습니까?' : '이 폴더의 전 키워드 순위 조회를 시작하시겠습니까?')) return;
    
    // Fetch recursive keywords
    const url = folderId === null ? '/api/keywords/recursive' : `/api/keywords/recursive?folderId=${folderId}`;
    const res = await fetch(url);
    const targetKeywords = await res.json();
    
    if (!targetKeywords || targetKeywords.length === 0) {
        showToast('조회할 키워드가 없습니다.');
        return;
    }

    const total = targetKeywords.length;
    showProgress();
    setProgress(0, total, '폴더 순위 조회 준비 중...');

    for (let i = 0; i < total; i++) {
        const k = targetKeywords[i];
        setProgress(i, total, `[${i + 1}/${total}] '${k.keyword}' 순위 조회 중...`);
        
        try {
            await fetch(`/api/keywords/${k.id}/update`, { method: 'POST' });
        } catch (err) {
            console.error(err);
        }
        
        await new Promise(r => setTimeout(r, 500));
    }

    setProgress(total, total, '모든 조회 완료!');
    setTimeout(() => {
        hideProgress();
        loadKeywords();
    }, 2000);
}

window.updateFolderRanks = updateFolderRanks;

// Fetch from API
async function loadFolders() {
  const res = await fetch('/api/folders');
  folders = await res.json();
  
  if (folders.length > 0) {
    // activeFolderId가 아직 없거나, 현재 목록에 없는 ID일 경우에만 첫 번째 폴더로 초기화
    if (activeFolderId === null || !folders.some(f => f.id === activeFolderId)) {
      activeFolderId = folders[0].id;
    }
    // 현재 활성화된 폴더의 부모들은 자동으로 펼치기
    expandParents(activeFolderId);
  }
  
  renderFolders();
  loadKeywords();
}

async function loadKeywords() {
  const url = activeFolderId ? `/api/keywords?folderId=${activeFolderId}` : '/api/keywords';
  const res = await fetch(url);
  keywords = await res.json();
  renderKeywords();
}

function renderFolders() {
  folderListEl.innerHTML = '';
  
  // Total Data Item
  const totalLi = document.createElement('li');
  totalLi.className = `folder-item ${activeFolderId === null ? 'active' : ''}`;
  totalLi.innerHTML = `
      <i class="fas fa-th-large"></i> 
      <span style="flex:1">전체 리스트</span>
      <i class="fas fa-sync-alt update-folder-ranks" onclick="event.stopPropagation(); updateFolderRanks(null)" title="전체 순위 조회" style="font-size:0.8rem; margin-right:5px; opacity: 0.5; cursor: pointer;"></i>
  `;
  totalLi.onclick = (e) => {
    e.stopPropagation();
    selectFolder(null);
  }
  folderListEl.appendChild(totalLi);

  // Build tree structure
  const folderMap = {};
  const tree = [];
  
  folders.forEach(f => {
    folderMap[f.id] = { ...f, children: [] };
  });
  
  folders.forEach(f => {
    if (f.parentId && folderMap[f.parentId]) {
      folderMap[f.parentId].children.push(folderMap[f.id]);
    } else {
      tree.push(folderMap[f.id]);
    }
  });

  function renderTree(items, level = 0) {
    items.forEach(folder => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      
      const li = document.createElement('li');
      li.className = `folder-item ${folder.id === activeFolderId ? 'active' : ''}`;
      li.style.paddingLeft = `${level * 20 + 15}px`; 
      
      const iconClass = (folder.id === activeFolderId) ? 'fa-folder-open' : 'fa-folder';
      const caretIcon = hasChildren 
          ? `<i class="fas ${isExpanded ? 'fa-caret-down' : 'fa-caret-right'} toggle-folder" onclick="event.stopPropagation(); toggleFolder(${folder.id})" style="margin-right:8px; cursor:pointer;"></i>` 
          : '<i class="fas fa-caret-right" style="margin-right:8px; visibility:hidden;"></i>';

      li.innerHTML = `
        ${caretIcon}
        <i class="fas ${iconClass}" style="${hasChildren ? 'color: var(--primary);' : ''}"></i>
        <span style="flex:1">${folder.name}</span>
        <i class="fas fa-sync-alt update-folder-ranks" onclick="event.stopPropagation(); updateFolderRanks(${folder.id})" title="이 폴더 순위 조회" style="font-size:0.8rem; margin-right:5px; opacity: 0.5; cursor: pointer;"></i>
        ${folder.name !== '기본 폴더' ? `
          <i class="fas fa-edit edit-folder-btn" onclick="event.stopPropagation(); openEditFolder(${folder.id}, '${folder.name.replace(/'/g, "\\'")}')" title="이름 수정" style="font-size:0.75rem; margin-right:5px; opacity: 0.5; cursor: pointer;"></i>
          <i class="fas fa-times-circle delete-folder" onclick="event.stopPropagation(); deleteFolderMsg(${folder.id})" title="삭제"></i>
        ` : ''}
      `;
      li.onclick = (e) => {
        e.stopPropagation();
        selectFolder(folder.id);
      };
      folderListEl.appendChild(li);
      
      if (hasChildren && isExpanded) {
        renderTree(folder.children, level + 1);
      }
    });
  }

  renderTree(tree);
  
  const activeFolder = folders.find(f => f.id === activeFolderId);
  currentFolderNameEl.textContent = activeFolder ? activeFolder.name : '폴더가 없습니다';
  modalFolderNameEl.textContent = activeFolder ? activeFolder.name : '-';

  // Update Parent Folder Select in Modal
  const parentSelect = document.getElementById('parentFolderSelect');
  if (parentSelect) {
    const currentVal = parentSelect.value;
    parentSelect.innerHTML = '<option value="">없음 (최상위)</option>';

    function populateSelect(items, level = 0) {
      items.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        const prefix = level > 0 ? '　'.repeat(level) + '└ ' : '';
        option.textContent = prefix + f.name;
        parentSelect.appendChild(option);
        if (f.children && f.children.length > 0) {
          populateSelect(f.children, level + 1);
        }
      });
    }
    
    populateSelect(tree);
    parentSelect.value = currentVal;
  }
}

function expandParents(folderId) {
    const folder = folders.find(f => f.id === folderId);
    if (folder && folder.parentId) {
        expandedFolders.add(folder.parentId);
        expandParents(folder.parentId);
    }
}

function selectFolder(id) {
  activeFolderId = id;
  if (id) expandParents(id); // 선택한 폴더의 부모들도 펼치기
  renderFolders();
  loadKeywords();
}

function showProgress(total = 1) {
  const container = document.getElementById('rankProgressContainer');
  const bar = document.getElementById('progressBar');
  if (!container || !bar) return;
  container.style.display = 'block';
  bar.style.width = '0%';
  document.getElementById('progressText').textContent = '준비 중...';
}

function setProgress(current, total, msg) {
  const bar = document.getElementById('progressBar');
  if (!bar) return;
  const percent = Math.round((current / total) * 100);
  bar.style.width = percent + '%';
  document.getElementById('progressText').textContent = msg || `순위 조회 중... (${current}/${total})`;
}

function hideProgress() {
  const container = document.getElementById('rankProgressContainer');
  if (container) container.style.display = 'none';
}

async function updateKeywordRank(id) {
  showProgress();
  const progressText = document.getElementById('progressText');
  if (progressText) progressText.textContent = '현재 키워드의 순위를 실시간 조회하고 있습니다...';
  try {
    const res = await fetch(`/api/keywords/${id}/update`, { method: 'POST' });
    if (!res.ok) throw new Error('조회 실패');
    setProgress(1, 1, '조회 완료!');
    setTimeout(hideProgress, 1000);
    loadKeywords();
  } catch (e) {
    console.error(e);
    showToast('순위 조회 중 오류가 발생했습니다.');
    hideProgress();
  }
}

async function updateAllRanks() {
  if (keywords.length === 0) {
    showToast('업데이트할 키워드가 없습니다.');
    return;
  }
  
  const total = keywords.length;
  showProgress(total);
  
  // 스냅샷 사용 (루프 도중 keywords가 변동될 가능성 차단)
  const snapshot = [...keywords];
  
  for (let i = 0; i < total; i++) {
    const k = snapshot[i];
    setProgress(i + 1, total, `[${i + 1}/${total}] '${k.keyword}' 순위 확인 중...`);
    
    try {
      const res = await fetch(`/api/keywords/${k.id}/update`, { method: 'POST' });
      if (res.ok) {
        // 각 키워드 업데이트 성공 시마다 목록을 갱신하여 사용자에게 피드백 제공
        await loadKeywords();
      } else {
        console.error(`[오류] 키워드 ID ${k.id} (${k.keyword}) 업데이트 실패`);
      }
    } catch (e) {
      console.error(`[네트워크 오류] ${k.keyword}:`, e);
    }
    
    // 네이버 API 안정성 및 서버 부하를 고려하여 지연시간(500ms) 추가
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  setProgress(total, total, '모든 키워드 순위 업데이트가 완료되었습니다!');
  loadKeywords();
  setTimeout(hideProgress, 2000);
}

async function simulateSearch(id) {
  showToast('검색 시뮬레이션을 시작합니다. 잠시만 기다려주세요...');
  await fetch(`/api/keywords/${id}/simulate`, { method: 'POST' });
}

async function deleteKeyword(id) {
  if (confirm('정말 삭제하시겠습니까?')) {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      loadKeywords();
      showToast('삭제되었습니다.');
    } catch (e) {
      console.error(e);
      showToast('삭제 중 오류가 발생했습니다.');
    }
  }
}

function renderKeywords(filter = '') {
  let list = keywords;
  if (filter) {
    const f = filter.toLowerCase();
    list = list.filter(k => k.keyword.toLowerCase().includes(f) || k.mid.includes(f));
  }

  keywordTableBody.innerHTML = '';
  itemCountEl.textContent = list.length;
  
  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.checked = false;

  if (list.length === 0) {
    emptyStateEl.style.display = 'block';
  } else {
    emptyStateEl.style.display = 'none';
    list.forEach(k => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="row-checkbox" data-id="${k.id}"></td>
        <td style="font-weight:700">${k.keyword}</td>
        <td>${k.mid}</td>
        <td style="color:#a0aec0">${k.catalogMid || '-'}</td>
        <td>${k.storeName || '-'}</td>
        <td style="color:#718096">${k.memo || '-'}</td>
        <td>
          <div style="display:flex; justify-content:center; align-items:center;">
            ${k.link ? (function() {
                const url = (k.link.startsWith('http')) ? k.link : 'https://' + k.link;
                return `<a href="${url}" target="_blank" class="btn btn-secondary" style="padding:4px 10px; font-size:0.75rem; background:#fee500; border:none; color:#3c1e1e; font-weight:700; text-decoration:none;" title="상품 페이지 바로가기"><i class="fas fa-external-link-alt"></i> 링크</a>`;
            })() : '<span style="color:#cbd5e0; font-size:0.7rem;">(조회필요)</span>'}
          </div>
        </td>
        <td><span class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem">${k.currentRank || '확인'}</span></td>
        <td>${k.yesterdayRank || '-'}</td>
        <td style="font-weight: 500;">
          ${k.rankChange > 0 
            ? `<span style="color: #e53e3e;"><i class="fas fa-caret-up"></i> ${k.rankChange}</span>` 
            : k.rankChange < 0 
              ? `<span style="color: #3182ce;"><i class="fas fa-caret-down"></i> ${Math.abs(k.rankChange)}</span>` 
              : `<span style="color: #a0aec0; font-size: 0.8rem;">-</span>`}
        </td>
        <td><button class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem; color:var(--primary); border-color:var(--primary)" onclick="updateKeywordRank('${k.id}')"><i class="fas fa-sync-alt"></i></button></td>
        <td><i class="fas fa-edit" style="color:var(--primary); cursor:pointer; font-size:0.9rem" onclick="openEditModal(${k.id})" title="정보 수정"></i></td>
        <td><i class="fas fa-trash" style="color:var(--danger); cursor:pointer" onclick="deleteKeyword('${k.id}')"></i></td>
      `;
      keywordTableBody.appendChild(tr);
    });
  }
}

async function openEditModal(id) {
  const k = keywords.find(item => item.id === id);
  if (!k) return;
  
  editingKeywordId = id;
  document.getElementById('productModal').classList.add('active');
  document.querySelector('#productModal h2').innerHTML = '<i class="fas fa-edit"></i> 상품 정보 수정';
  document.getElementById('saveProductBtn').textContent = '수정 완료';
  
  document.getElementById('pdKeyword').value = k.keyword || '';
  document.getElementById('pdMid').value = k.mid || '';
  document.getElementById('pdCatMid').value = k.catalogMid || '';
  document.getElementById('pdStore').value = k.storeName || '';
  document.getElementById('pdMemo').value = k.memo || '';
  document.getElementById('pdLink').value = k.link || '';
}

async function openEditFolder(id, name) {
    editingFolderId = id;
    document.getElementById('folderModal').classList.add('active');
    document.querySelector('#folderModal h2').innerHTML = '<i class="fas fa-folder-open"></i> 폴더 이름 수정';
    document.getElementById('newFolderName').value = name;
    
    // 수정 시에는 상위 폴더 선택 필드를 숨기거나 비활성화 (이름만 수정하도록 단순화)
    const parentField = document.getElementById('parentFolderSelect').parentElement;
    if (parentField) parentField.style.display = 'none';
    
    document.getElementById('saveFolderBtn').textContent = '수정 완료';
}

async function deleteFolderMsg(id) {
  if (confirm('정말 이 폴더를 삭제하시겠습니까? 하위 폴더와 포함된 모든 키워드가 함께 삭제됩니다.')) {
    await fetch(`/api/folders/${id}`, { method: 'DELETE' });
    activeFolderId = null;
    loadFolders();
    showToast('폴더가 삭제되었습니다.');
  }
}

function bindEvents() {
  document.getElementById('addFolderBtn').onclick = () => {
    editingFolderId = null;
    document.getElementById('newFolderName').value = '';
    document.getElementById('folderModal').classList.add('active');
    document.querySelector('#folderModal h2').innerHTML = '<i class="fas fa-folder-plus"></i> 새 폴더 추가';
    document.getElementById('saveFolderBtn').textContent = '생성하기';
    
    const parentField = document.getElementById('parentFolderSelect').parentElement;
    if (parentField) parentField.style.display = 'block';
  };
  
  document.getElementById('addProductBtn').onclick = () => {
    editingKeywordId = null;
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.add('active');
    document.querySelector('#productModal h2').innerHTML = '<i class="fas fa-plus-circle"></i> 상품 등록';
    document.getElementById('saveProductBtn').textContent = '저장하기';
  };

  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    };
  });

  document.getElementById('saveFolderBtn').onclick = async () => {
    const name = document.getElementById('newFolderName').value;
    const parentId = document.getElementById('parentFolderSelect').value || null;
    if (!name) return;

    if (editingFolderId) {
        // Update
        await fetch(`/api/folders/${editingFolderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        showToast('폴더 이름이 수정되었습니다.');
    } else {
        // Create
        const response = await fetch('/api/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, parentId: parentId ? parseInt(parentId) : null })
        });
        const newFolder = await response.json();
        activeFolderId = newFolder.id;
        showToast('폴더가 생성되었습니다.');
    }
    
    document.getElementById('newFolderName').value = '';
    document.getElementById('parentFolderSelect').value = '';
    document.getElementById('folderModal').classList.remove('active');
    loadFolders();
  };

  document.getElementById('saveProductBtn').onclick = async () => {
    const keyword = document.getElementById('pdKeyword').value;
    const mid = document.getElementById('pdMid').value;
    if (keyword && mid) {
      const payload = {
          keyword, mid,
          catalogMid: document.getElementById('pdCatMid').value,
          storeName: document.getElementById('pdStore').value,
          memo: document.getElementById('pdMemo').value,
          link: document.getElementById('pdLink').value,
          folder: { id: activeFolderId }
      };

      if (editingKeywordId) {
          // Update
          await fetch(`/api/keywords/${editingKeywordId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
          });
          showToast('정보가 수정되었습니다.');
      } else {
          // Create
          await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          showToast('상품이 등록되었습니다.');
      }
      
      document.getElementById('productForm').reset();
      document.getElementById('productModal').classList.remove('active');
      loadKeywords();
    }
  };

  window.openEditModal = openEditModal;
  window.openEditFolder = openEditFolder;

  // Excel handlers
  document.getElementById('excelUploadBtn').onclick = () => {
    document.getElementById('excelFile').click();
  };

  document.getElementById('excelFile').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const targetFolderId = activeFolderId; // 업로드 시작 시점의 폴더 ID 고정
      const formData = new FormData();
      formData.append('file', file);
      
      showToast('파일 분석 중...');
      
      fetch('/api/excel/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(async data => {
          showProgress(data.length);
          let successCount = 0;
          
          for(const item of data) {
              item.folder = { id: targetFolderId }; // 스냅샷된 ID 사용
              try {
                  const saveRes = await fetch('/api/keywords', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(item)
                  });
                  if (saveRes.ok) successCount++;
              } catch (err) {
                  console.error('업로드 중 오류:', err);
              }
              setProgress(successCount, data.length, `업로드 중... (${successCount}/${data.length})`);
          }
          
          await loadKeywords();
          showToast(`${successCount}건의 상품이 등록되었습니다.`);
          setTimeout(hideProgress, 2000);
      })
      .catch(err => {
          console.error('업로드 실패:', err);
          showToast('파일 업로드 중 오류가 발생했습니다.');
      })
      .finally(() => e.target.value = '');
    }
  };

  searchInput.oninput = (e) => renderKeywords(e.target.value);

  const selectAll = document.getElementById('selectAll');
  if (selectAll) {
    selectAll.onchange = (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = checked);
    };
  }

  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  if (deleteSelectedBtn) {
    deleteSelectedBtn.onclick = async () => {
      const checkboxes = document.querySelectorAll('.row-checkbox:checked');
      if (checkboxes.length === 0) {
        showToast('삭제할 항목을 선택해주세요.');
        return;
      }
      if (confirm(`선택한 ${checkboxes.length}개 항목을 정말 삭제하시겠습니까?`)) {
        for (const cb of checkboxes) {
          const id = cb.dataset.id;
          await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
        }
        loadKeywords();
        showToast('선택한 항목이 삭제되었습니다.');
      }
    };
  }

  const refreshBtn = document.getElementById('refreshAllBtn');
  if (refreshBtn) {
    refreshBtn.onclick = updateAllRanks;
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', init);
