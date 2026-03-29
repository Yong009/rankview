// dashboard.js - Dynamic dates and month navigation
let allFolders = [];
let currentKeywords = [];
let activeFolderId = null;
let expandedFolders = new Set();
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;

// DOM Elements
const dashboardTableBody = document.getElementById('dashboardTableBody');
const tableHeaderRow = document.getElementById('tableHeaderRow');
const tableFooterRow = document.getElementById('tableFooterRow');
const searchInput = document.getElementById('searchInput');

// Initialize
async function init() {
    await loadFolders();
    await loadAllKeywords();
    bindEvents();
}

function updateMonthDisplay() {
    const el = document.getElementById('currentMonthDisplay');
    if (el) el.textContent = `${currentYear}년 ${String(currentMonth).padStart(2, '0')}월`;
}

window.changeMonth = async function(delta) {
    currentMonth += delta;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    updateMonthDisplay();
    renderKeywords(); // Refresh table contents for the new month
};


function renderFolderList() {
    const listEl = document.getElementById('folderList');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    totalLi.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; width:100%;">
            <i class="fas fa-th-large"></i> 
            <span class="folder-name" style="flex:1;">전체 대시보드</span>
            <i class="fas fa-sync-alt update-folder-ranks" onclick="event.stopPropagation(); updateFolderRanks(null)" title="전체 순위 조회"></i>
        </div>
    `;
    totalLi.onclick = () => {
        activeFolderId = null;
        loadAllKeywords();
    };
    listEl.appendChild(totalLi);

    const rootFolders = allFolders.filter(f => !f.parentId);
    rootFolders.forEach(folder => renderFolderTree(folder, listEl, 0));
}

function renderFolderTree(folder, container, depth) {
    const children = allFolders.filter(f => f.parentId === folder.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isActive = activeFolderId === folder.id;

    const li = document.createElement('li');
    li.className = `folder-item ${isActive ? 'active' : ''}`;
    li.style.paddingLeft = `${depth * 20 + 15}px`;
    
    li.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; width:100%;">
            ${hasChildren ? `<i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}" style="width:12px; font-size:0.7rem;"></i>` : '<span style="width:12px;"></span>'}
            <i class="fas ${hasChildren ? (isExpanded ? 'fa-folder-open' : 'fa-folder') : 'fa-folder'}"></i>
            <span class="folder-name" style="flex:1;">${folder.name}</span>
            <i class="fas fa-sync-alt update-folder-ranks" onclick="event.stopPropagation(); updateFolderRanks(${folder.id})" title="이 폴더 순위 조회" style="font-size:0.8rem; margin-right:5px;"></i>
            ${folder.name !== '기본 폴더' ? `<i class="fas fa-times-circle delete-folder" onclick="event.stopPropagation(); deleteFolderMsg(${folder.id})" title="삭제"></i>` : ''}
        </div>
    `;

    li.onclick = (e) => {
        e.stopPropagation();
        activeFolderId = folder.id;
        if (hasChildren) {
            if (expandedFolders.has(folder.id)) expandedFolders.delete(folder.id);
            else expandedFolders.add(folder.id);
        }
        renderFolderList();
        loadKeywordsRecursive(folder.id);
    };

    container.appendChild(li);
    if (isExpanded && hasChildren) {
        children.forEach(child => renderFolderTree(child, container, depth + 1));
    }
}

// dashboard.js - Updated with Grouping & Breadcrumb
async function loadAllKeywords() {
    try {
        console.log("[Dashboard] Fetching all keywords...");
        const response = await fetch('/api/dashboard/keywords');
        currentKeywords = await response.json();
        activeFolderId = null;
        document.getElementById('currentFolderName').textContent = '전체 대시보드';
        document.getElementById('itemCount').textContent = currentKeywords.length;
        renderBreadcrumb(null);
        renderKeywords();
        renderFolderList();
        updateMonthDisplay();
    } catch (error) {
        console.error('Error loading all keywords:', error);
        showToast('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

async function loadKeywordsRecursive(folderId) {
    try {
        const response = await fetch(`/api/dashboard/keywords/recursive?folderId=${folderId}`);
        currentKeywords = await response.json();
        const activeFolder = allFolders.find(f => f.id === folderId);
        document.getElementById('currentFolderName').textContent = activeFolder ? activeFolder.name : '폴더';
        document.getElementById('itemCount').textContent = currentKeywords.length;
        renderBreadcrumb(folderId);
        renderKeywords();
    } catch (error) {
        console.error('Error recursive loading:', error);
    }
}

function renderBreadcrumb(folderId) {
    const breadcrumbEl = document.getElementById('dashboardBreadcrumb');
    if (!breadcrumbEl) return;
    breadcrumbEl.innerHTML = `<span onclick="loadAllKeywords()" style="cursor:pointer; font-weight:700; color:var(--primary);">전체</span>`;
    
    if (folderId) {
        const path = [];
        let curr = allFolders.find(f => f.id === folderId);
        while (curr) {
            path.unshift(curr);
            curr = allFolders.find(f => f.id === curr.parentId);
        }
        path.forEach(p => {
            breadcrumbEl.innerHTML += ` <i class="fas fa-chevron-right" style="font-size:0.6rem; opacity:0.5;"></i> <span onclick="loadKeywordsRecursive(${p.id})" style="cursor:pointer;">${p.name}</span>`;
        });
    }
}

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

let checkedRootIds = new Set(); // IDs of root folders to show

async function loadFolders() {
    try {
        const response = await fetch('/api/folders');
        allFolders = await response.json();
        renderFolderList();
        updateParentFolderSelect();
        updateExcelFolderSelect();
        initFilterBar(); // Populate the new filter bar
    } catch (error) {
        console.error('Error loading folders:', error);
    }
}

function initFilterBar() {
    const listEl = document.getElementById('filterControlList');
    if (!listEl) return;
    
    // Clear list but keep 'All' checkbox
    const allPill = document.getElementById('filterCheckAll');
    listEl.innerHTML = '';
    listEl.appendChild(allPill);

    const rootFolders = allFolders.filter(f => !f.parentId);
    
    // Add 'Unclassified' (no folder) pill
    addFilterPill(-1, '미분류', listEl);
    
    rootFolders.forEach(f => {
        addFilterPill(f.id, f.name, listEl);
    });

    // Default: Check all
    toggleAllFilters(true);
}

function addFilterPill(id, name, container) {
    const div = document.createElement('div');
    div.className = 'filter-pill active';
    div.style = 'cursor:pointer; display:flex; align-items:center; gap:6px; font-size:0.85rem; font-weight:600; padding:6px 12px; background:#f8fafc; color:var(--text-main); border-radius:30px; border:1px solid var(--border-color);';
    div.innerHTML = `<input type="checkbox" checked value="${id}" class="folder-filter-checkbox" style="width:14px; height:14px; cursor:pointer;"> ${name}`;
    
    const cb = div.querySelector('input');
    cb.onchange = () => {
        if (cb.checked) {
            checkedRootIds.add(Number(cb.value));
            div.style.background = 'var(--primary-light)';
            div.style.color = 'var(--primary)';
            div.style.borderColor = 'var(--primary)';
        } else {
            checkedRootIds.delete(Number(cb.value));
            div.style.background = '#f8fafc';
            div.style.color = 'var(--text-main)';
            div.style.borderColor = 'var(--border-color)';
            document.getElementById('allCheck').checked = false;
        }
        renderKeywords(); // Apply filter
    };
    
    div.onclick = () => { cb.checked = !cb.checked; cb.onchange(); };
    cb.onclick = (e) => e.stopPropagation();
    
    container.appendChild(div);
    checkedRootIds.add(id);
}

async function updateFolderRanks(folderId) {
    if (!confirm(folderId === null ? '전체 키워드의 순위 조회를 시작하시겠습니까?' : '이 폴더의 전 키워드 순위 조회를 시작하시겠습니까?')) return;
    
    let targetKeywords = [];
    if (folderId === null) {
        targetKeywords = currentKeywords;
    } else {
        // Fetch recursively (or use current view if activeFolderId matches)
        const response = await fetch(`/api/dashboard/keywords/recursive?folderId=${folderId}`);
        targetKeywords = await response.json();
    }

    if (targetKeywords.length === 0) {
        showToast('조회할 키워드가 없습니다.');
        return;
    }

    const total = targetKeywords.length;
    showProgress();
    setProgress(0, total, `폴더 순위 조회 준비 중... (0/${total})`);

    let successCount = 0;
    for (let i = 0; i < targetKeywords.length; i++) {
        const k = targetKeywords[i];
        const name = k.productName || k.keyword;
        setProgress(i, total, `[${i + 1}/${total}] '${name}' 순위 조회 중...`);

        try {
            const res = await fetch(`/api/keywords/${k.id}/update`, { method: 'POST' });
            if (res.ok) successCount++;
        } catch (err) { console.error(err); }
        
        await new Promise(r => setTimeout(r, 500));
    }

    setProgress(total, total, `폴더 조회 완료! (성공: ${successCount})`);
    setTimeout(() => {
        hideProgress();
        if (activeFolderId) loadKeywordsRecursive(activeFolderId);
        else loadAllKeywords();
    }, 2000);
}

window.updateFolderRanks = updateFolderRanks;

window.toggleSelectAll = function(checked) {
    const cbs = document.querySelectorAll('.dashboard-row-checkbox');
    cbs.forEach(cb => cb.checked = checked);
};

async function bulkUpdateSelected() {
    const selectedCbs = document.querySelectorAll('.dashboard-row-checkbox:checked');
    if (selectedCbs.length === 0) {
        showToast('순위 조회할 항목을 선택해주세요.');
        return;
    }

    const total = selectedCbs.length;
    showProgress();
    setProgress(0, total, `순위 조회 준비 중... (0/${total})`);

    const ids = Array.from(selectedCbs).map(cb => cb.dataset.id);
    let successCount = 0;

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const kw = currentKeywords.find(k => k.id == id);
        const name = kw ? (kw.productName || kw.keyword) : id;

        setProgress(i, total, `[${i + 1}/${total}] '${name}' 순위 조회 중...`);

        try {
            const res = await fetch(`/api/keywords/${id}/update`, { method: 'POST' });
            if (res.ok) {
                successCount++;
            }
        } catch (err) {
            console.error('Update error:', err);
        }
        
        // Naver API stability delay
        await new Promise(r => setTimeout(r, 500));
    }

    setProgress(total, total, `모든 조회 완료! (성공: ${successCount})`);
    setTimeout(() => {
        hideProgress();
        if (activeFolderId) loadKeywordsRecursive(activeFolderId);
        else loadAllKeywords();
    }, 2000);
}

function showProgress() {
    const el = document.getElementById('rankProgressContainer');
    if (el) el.style.display = 'block';
}

function setProgress(current, total, msg) {
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    if (bar) {
        const percent = total > 0 ? (current / total) * 100 : 0;
        bar.style.width = percent + '%';
    }
    if (text) text.textContent = msg;
}

function hideProgress() {
    const el = document.getElementById('rankProgressContainer');
    if (el) el.style.display = 'none';
}

window.bulkUpdateSelected = bulkUpdateSelected;

window.toggleAllFilters = function(checked) {
    const cbs = document.querySelectorAll('.folder-filter-checkbox');
    cbs.forEach(cb => {
        cb.checked = checked;
        const div = cb.parentElement;
        if (checked) {
            checkedRootIds.add(Number(cb.value));
            div.style.background = 'var(--primary-light)';
            div.style.color = 'var(--primary)';
            div.style.borderColor = 'var(--primary)';
        } else {
            checkedRootIds.delete(Number(cb.value));
            div.style.background = '#f8fafc';
            div.style.color = 'var(--text-main)';
            div.style.borderColor = 'var(--border-color)';
        }
    });
    renderKeywords();
};

function getRootFolder(folderId) {
    let curr = allFolders.find(f => f.id === folderId);
    if (!curr) return null;
    while (curr && curr.parentId) {
        const next = allFolders.find(f => f.id === curr.parentId);
        if (!next) break;
        curr = next;
    }
    return curr;
}

function renderKeywords(filter = '') {
    let list = currentKeywords;
    
    // Apply Multi-select Filter
    list = list.filter(k => {
        let root = k.folder ? getRootFolder(k.folder.id) : null;
        let rootId = root ? root.id : -1;
        return checkedRootIds.has(rootId);
    });

    if (filter) {
        const f = filter.toLowerCase();
        list = list.filter(k => 
            k.keyword.toLowerCase().includes(f) || 
            k.mid.includes(f) || 
            (k.productName && k.productName.toLowerCase().includes(f))
        );
    }
    // ... rendering logic continues

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);

    // Standard Header
    tableHeaderRow.innerHTML = `
        <th class="sticky-col-1" width="80">이미지</th>
        <th class="sticky-col-2" width="320">상품 정보 (명칭/ID)</th>
        ${Array.from({ length: daysInMonth }, (_, i) => `<th class="cell-day-header">${i + 1}일</th>`).join('')}
    `;

    dashboardTableBody.innerHTML = '';
    const selectAllCheck = document.getElementById('selectAllCheck');
    if (selectAllCheck) selectAllCheck.checked = false;
    
    const totals = Array(daysInMonth).fill(0);

    if (list.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
    } else {
        document.getElementById('emptyState').style.display = 'none';
        list.forEach(k => {
            const tr = document.createElement('tr');
            
            const checkboxHtml = `
                <td class="sticky-checkbox text-center" style="padding:0">
                    <input type="checkbox" class="dashboard-row-checkbox" data-id="${k.id}" onclick="event.stopPropagation()">
                </td>
            `;

            const imgHtml = `
                <td class="sticky-col-1 p-0">
                    <div class="product-thumb-container">
                        ${k.imageUrl ? `<img src="${k.imageUrl}" class="product-thumb" alt="thumb">` : 
                        `<div class="img-placeholder" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#cbd5e0; cursor:pointer;" onclick="triggerImageUpload(${k.id})">
                             <i class="fas fa-plus" style="font-size:1.5rem; color:#6366f1;"></i>
                         </div>`}
                    </div>
                </td>
            `;

            const infoHtml = `
                <td class="sticky-col-2">
                    <div class="product-info-combined">
                        <div class="info-top-area" title="${k.productName || k.keyword}">
                            ${k.productName || k.keyword}
                        </div>
                        <div class="product-info-divider"></div>
                        <div class="info-bottom-area">
                            <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">[ID]</span> ${k.productNumber || k.mid || '-'}
                        </div>
                    </div>
                </td>
            `;

            let daysHtml = '';
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayData = k.dailyData ? k.dailyData.find(d => d.date === dateStr) || {} : {};
                totals[day-1] += (dayData.inflowCount || 0);
                daysHtml += `
                    <td class="cell-daily">
                        <div class="cell-container">
                            <div class="inflow-row">${dayData.inflowCount || ''}</div>
                            <div class="memo-row editable-memo" onclick="inlineEditMemo(this, ${k.id}, '${dateStr}')" title="${dayData.dailyMemo || ''}">
                                ${dayData.dailyMemo || ''}
                            </div>
                        </div>
                    </td>`;
            }

            tr.innerHTML = checkboxHtml + imgHtml + infoHtml + daysHtml;
            dashboardTableBody.appendChild(tr);
        });
    }
    tableFooterRow.innerHTML = `
        <tr>
            <td colspan="2" style="text-align:right; padding-right:20px; font-weight:800; background: #f1f5f9;">일별 유입수 합계</td>
            ${totals.map(t => `<td style="text-align:center; padding: 12px 10px; color: var(--primary); font-size:1.1rem; background: #f8fafc; border-top: 2px solid var(--border-color);">${t.toLocaleString()}</td>`).join('')}
        </tr>
    `;
}

async function inlineEditMemo(el, id, date) {
    if (el.querySelector('input')) return;
    const originalValue = el.textContent.trim();
    el.innerHTML = `<input type="text" class="inline-input" value="${originalValue}" style="width:100%; height:100%; border:none; background:transparent; text-align:center; font-size:0.75rem; outline:none; color:var(--text-main);">`;
    const input = el.querySelector('input');
    input.focus();
    input.select();
    
    const save = async () => {
        const newValue = input.value.trim();
        if (newValue !== originalValue) {
            const res = await fetch('/api/dashboard/memo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keywordId: id, date: date, memo: newValue })
            });
            if (res.ok) {
                el.textContent = newValue;
                el.title = newValue;
                const kw = currentKeywords.find(k => k.id == id);
                if (kw && kw.dailyData) {
                    const dd = kw.dailyData.find(d => d.date === date);
                    if (dd) dd.dailyMemo = newValue;
                    else kw.dailyData.push({ date: date, dailyMemo: newValue });
                }
                showToast('저장되었습니다.');
            } else {
                el.textContent = originalValue;
                showToast('저장 실패');
            }
        } else {
            el.textContent = originalValue;
        }
    };
    input.onblur = save;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') { 
            input.onblur = null; 
            el.textContent = originalValue; 
        }
    };
}

async function deleteFolderMsg(id) {
    if (confirm('정말 이 폴더를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) {
        const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
        if (res.ok) {
            activeFolderId = null;
            await loadFolders();
            loadAllKeywords();
        }
    }
}

function updateParentFolderSelect() {
    const parentSelect = document.getElementById('parentFolderSelect');
    if (!parentSelect) return;
    parentSelect.innerHTML = '<option value="">없음 (최상위)</option>';
    const rootFolders = allFolders.filter(f => !f.parentId);
    const populate = (items, level = 0) => {
        items.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = '　'.repeat(level) + (level > 0 ? '└ ' : '') + f.name;
            parentSelect.appendChild(opt);
            const children = allFolders.filter(child => child.parentId === f.id);
            if (children.length > 0) populate(children, level + 1);
        });
    };
    populate(rootFolders);
}

function bindEvents() {
    if (searchInput) {
        searchInput.oninput = (e) => renderKeywords(e.target.value);
    }
    
    // Excel Modal
    const uploadExcelBtn = document.getElementById('uploadExcelBtn');
    const excelModal = document.getElementById('excelModal');
    if (uploadExcelBtn && excelModal) {
        uploadExcelBtn.onclick = () => {
            updateExcelFolderSelect();
            excelModal.classList.add('active');
        };
    }

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        };
    });

    // Start Upload
    const startUploadBtn = document.getElementById('startUploadBtn');
    if (startUploadBtn) {
        startUploadBtn.onclick = async () => {
            const fileInput = document.getElementById('excelFileInput');
            if (fileInput.files.length === 0) {
                alert('파일을 선택해주세요.');
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            formData.append('folderId', document.getElementById('excelTargetFolder').value);
            formData.append('year', document.getElementById('excelYear').value);
            formData.append('month', document.getElementById('excelMonth').value);
            
            startUploadBtn.disabled = true;
            startUploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 업로드 중...';
            
            try {
                const res = await fetch('/api/dashboard/excel-upload', { method: 'POST', body: formData });
                if (res.ok) {
                    showToast('성공적으로 업로드되었습니다.');
                    excelModal.classList.remove('active');
                    if (activeFolderId) loadKeywordsRecursive(activeFolderId);
                    else loadAllKeywords();
                } else {
                    alert('업로드 실패: ' + await res.text());
                }
            } catch (err) {
                console.error(err);
                alert('서버 통신 오류');
            } finally {
                startUploadBtn.disabled = false;
                startUploadBtn.innerHTML = '<i class="fas fa-upload"></i> 업로드 시작';
                fileInput.value = '';
            }
        };
    }
}

function updateExcelFolderSelect() {
    const selector = document.getElementById('excelTargetFolder');
    if (!selector) return;
    selector.innerHTML = '<option value="">없음 (전체 대시보드)</option>';
    
    const populate = (items, level = 0) => {
        items.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = '　'.repeat(level) + (level > 0 ? '└ ' : '') + f.name;
            selector.appendChild(opt);
            const children = allFolders.filter(child => child.parentId === f.id);
            if (children.length > 0) populate(children, level + 1);
        });
    };
    populate(allFolders.filter(f => !f.parentId));
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Global scope
let targetKeywordIdForImage = null;
window.triggerImageUpload = function(id) {
    targetKeywordIdForImage = id;
    document.getElementById('dashboardImageInput').click();
};

document.getElementById('dashboardImageInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file && targetKeywordIdForImage) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('id', targetKeywordIdForImage);
        try {
            const res = await fetch('/api/dashboard/image-upload', { method: 'POST', body: formData });
            if (res.ok) {
                showToast('이미지가 등록되었습니다.');
                if (activeFolderId) loadKeywordsRecursive(activeFolderId);
                else loadAllKeywords();
            }
        } catch (err) { console.error(err); }
    }
    this.value = '';
});

document.addEventListener('DOMContentLoaded', init);
