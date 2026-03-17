document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-indexed

let allFolders = [];
let activeFolderId = null;
let currentKeywords = []; // 전체 키워드 저장
let filteredKeywords = []; // 필터링된 키워드 저장

async function initDashboard() {
    setupMonthSelector();
    await loadFolders();
    setupEventListeners();
}

function setupMonthSelector() {
    const header = document.querySelector('.current-folder-info');
    const monthHtml = `
        <div class="month-selector" style="display:flex; align-items:center; gap:15px; margin-left: 20px;">
            <button id="prevMonth" class="btn-icon"><i class="fas fa-chevron-left"></i></button>
            <span id="currentMonthDisplay" style="font-weight:700; font-size:1.1rem;">${currentYear}년 ${currentMonth}월</span>
            <button id="nextMonth" class="btn-icon"><i class="fas fa-chevron-right"></i></button>
        </div>
    `;
    header.insertAdjacentHTML('beforeend', monthHtml);

    document.getElementById('prevMonth').onclick = () => changeMonth(-1);
    document.getElementById('nextMonth').onclick = () => changeMonth(1);
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    document.getElementById('currentMonthDisplay').textContent = `${currentYear}년 ${currentMonth}월`;
    renderTableHeaders();
    if (activeFolderId) loadKeywords(activeFolderId);
}

async function loadFolders() {
    try {
        const response = await fetch('api/folders');
        allFolders = await response.json();
        renderFolderList();
    } catch (error) {
        console.error('Error loading folders:', error);
    }
}

function renderFolderList() {
    const listEl = document.getElementById('folderList');
    listEl.innerHTML = '';
    
    // Simple flat rendering for now, or recursive for hierarchy
    const rootFolders = allFolders.filter(f => !f.parentId);
    rootFolders.forEach(folder => {
        renderFolderTree(folder, listEl, 0);
    });
}

function renderFolderTree(folder, container, depth) {
    const li = document.createElement('li');
    li.className = `folder-item ${folder.id === activeFolderId ? 'active' : ''}`;
    li.style.paddingLeft = `${depth * 20 + 16}px`;
    li.dataset.id = folder.id;
    
    const children = allFolders.filter(f => f.parentId === folder.id);
    const hasChildren = children.length > 0;

    li.innerHTML = `
        <i class="fas ${hasChildren ? 'fa-folder' : 'fa-folder-open'}"></i>
        <span class="folder-name">${folder.name}</span>
    `;

    li.onclick = (e) => {
        e.stopPropagation();
        activeFolderId = folder.id;
        document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        
        // Load keywords for this folder and all subfolders
        loadKeywordsRecursive(folder.id);
    };

    container.appendChild(li);
    children.forEach(child => renderFolderTree(child, container, depth + 1));
}

async function loadKeywordsRecursive(parentId) {
    try {
        const folderIds = getAllChildFolderIds(parentId);
        let allKeywords = [];
        
        // Fetch keywords for each folder (DASHBOARD 타입만 가져오도록 API 변경)
        for (let fid of folderIds) {
            const response = await fetch(`api/dashboard/keywords?folderId=${fid}`);
            if (response.ok) {
                const keywords = await response.json();
                allKeywords = allKeywords.concat(keywords);
            }
        }
        
        // Fetch daily data for each keyword
        for (let k of allKeywords) {
            const dailyRes = await fetch(`api/dashboard/data/${k.id}?year=${currentYear}&month=${currentMonth}`);
            if (dailyRes.ok) {
                k.dailyData = await dailyRes.json();
            } else {
                k.dailyData = [];
            }
        }
        
        currentKeywords = allKeywords;
        filteredKeywords = allKeywords;
        updateMidSelector();
        renderKeywords(filteredKeywords);
        document.getElementById('currentFolderName').textContent = allFolders.find(f => f.id == parentId)?.name || '기본 폴더';
    } catch (error) {
        console.error('Error loading keywords recursively:', error);
    }
}

function updateMidSelector() {
    const selector = document.getElementById('midFilterSelect');
    if (!selector) return;
    
    // Get unique Product Numbers
    const productNumbers = [...new Set(currentKeywords.map(k => k.productNumber).filter(pn => pn))].sort();
    
    selector.innerHTML = '<option value="">전체 상품번호</option>';
    productNumbers.forEach(pn => {
        const opt = document.createElement('option');
        opt.value = pn;
        opt.textContent = pn;
        selector.appendChild(opt);
    });
}

function filterKeywords() {
    const filterVal = document.getElementById('midFilterSelect').value;
    
    if (!filterVal) {
        filteredKeywords = currentKeywords;
    } else {
        filteredKeywords = currentKeywords.filter(k => k.productNumber === filterVal);
    }
    renderKeywords(filteredKeywords);
}

function getAllChildFolderIds(parentId) {
    let ids = [parentId];
    const children = allFolders.filter(f => f.parentId == parentId);
    children.forEach(child => {
        ids = ids.concat(getAllChildFolderIds(child.id));
    });
    return ids;
}

async function loadKeywords(folderId) {
    // Legacy support or direct load
    await loadKeywordsRecursive(folderId);
}

function renderTableHeaders() {
    const headerRow = document.getElementById('tableHeaderRow');
    const filterRow = document.getElementById('tableFilterRow');
    
    // Clear dynamic columns
    while (headerRow.children.length > 3) headerRow.removeChild(headerRow.lastChild);
    while (filterRow.children.length > 3) filterRow.removeChild(filterRow.lastChild);
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const th = document.createElement('th');
        th.textContent = `${i}일`;
        th.style.minWidth = '70px';
        headerRow.appendChild(th);
        
        const fth = document.createElement('th');
        fth.style.textAlign = 'center';
        fth.textContent = '-';
        filterRow.appendChild(fth);
    }
}

function renderKeywords(keywords) {
    const tbody = document.getElementById('keywordTableBody');
    tbody.innerHTML = '';
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    renderTableHeaders(); 
    
    // For totals
    const dailyTotals = new Array(daysInMonth).fill(0);
    
    keywords.forEach(k => {
        const tr = document.createElement('tr');
        // ... 생략 (기존 렌더링 로직)
        let html = `
            <td style="text-align:center;"><input type="checkbox" class="row-checkbox" data-id="${k.id}"></td>
            <td style="text-align:center;">
                <div class="cell-image-container" onclick="triggerImageUpload(${k.id})" style="cursor:pointer;">
                    ${k.imageUrl ? 
                        `<img src="${k.imageUrl}" class="cell-image" onerror="this.src='https://via.placeholder.com/50';">` : 
                        `<div class="img-placeholder"><i class="fas fa-camera"></i></div>`
                    }
                </div>
            </td>
            <td class="${k.highlight ? 'cell-highlight-yellow' : ''}" style="padding: 10px 15px;">
                <div class="cell-product-info">
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span class="cell-product-id editable-text" onclick="inlineEdit(this, ${k.id}, 'productNumber')">${k.productNumber || '상품번호 입력'}</span>
                    </div>
                    <div class="cell-product-name editable-text" onclick="inlineEdit(this, ${k.id}, 'productName')" style="margin: 4px 0;">${k.productName || '상품명 입력'}</div>
                    <div class="cell-product-id" style="color:var(--primary); font-weight:800; cursor:pointer;" onclick="editPrice(${k.id}, ${k.price})">
                        ${(k.price || 0).toLocaleString()}원
                    </div>
                </div>
            </td>
        `;
        
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const dayData = k.dailyData.find(d => d.date === dateStr) || { inflowCount: 0, dailyMemo: '' };
            
            dailyTotals[i-1] += (dayData.inflowCount || 0);

            const isHighlighted = (dayData.rank && dayData.rank <= 10); 
            html += `
                <td class="cell-daily ${isHighlighted ? 'cell-highlight-yellow' : ''}">
                    <div class="cell-container">
                        <div class="inflow-row" style="font-size:1.1rem;">${dayData.inflowCount || ''}</div>
                        <div class="memo-row" onclick="editMemo(${k.id}, '${dateStr}', '${dayData.dailyMemo || ''}')" title="${dayData.dailyMemo || ''}">
                            ${dayData.dailyMemo || ''}
                        </div>
                    </div>
                </td>
            `;
        }
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    renderTableFooter(dailyTotals);
    document.getElementById('itemCount').textContent = keywords.length;
}

function renderTableFooter(totals) {
    const tfoot = document.getElementById('tableFooterRow');
    let html = `
        <tr>
            <td colspan="3" style="text-align:right; padding-right:20px;">일별 유입수 합계</td>
            ${totals.map(t => `<td style="text-align:center; padding: 12px 10px; color: var(--primary); font-size:1.1rem;">${t.toLocaleString()}</td>`).join('')}
        </tr>
    `;
    tfoot.innerHTML = html;
}

function getParentFolderName(folderId) {
    const folder = allFolders.find(f => f.id == folderId);
    return folder ? folder.name : '-';
}

function renderRankChange(change) {
    if (change > 0) return `<span class="tag-up"><i class="fas fa-caret-up"></i> ${change}</span>`;
    if (change < 0) return `<span class="tag-down"><i class="fas fa-caret-down"></i> ${Math.abs(change)}</span>`;
    return `<span style="color:#94a3b8">-</span>`;
}

// Interactivity
function inlineEdit(el, id, field) {
    if (el.querySelector('input')) return;
    
    const originalValue = (el.textContent === '상품번호 입력' || el.textContent === '상품명 입력') ? '' : el.textContent;
    el.innerHTML = `<input type="text" class="inline-input" value="${originalValue}" style="width:100%; padding:2px 5px; border:1px solid var(--primary); border-radius:4px;">`;
    const input = el.querySelector('input');
    input.focus();
    
    const save = async () => {
        const newValue = input.value.trim();
        if (newValue !== originalValue) {
            const data = {};
            data[field] = newValue;
            await updateKeywordInfo(id, data);
        } else {
            el.textContent = originalValue || (field === 'productNumber' ? '상품번호 입력' : (field === 'productName' ? '상품명 입력' : ''));
        }
    };
    
    input.onblur = save;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') {
            input.onblur = null;
            el.textContent = originalValue || (field === 'productNumber' ? '상품번호 입력' : (field === 'productName' ? '상품명 입력' : ''));
        }
    };
}

async function editKeywordName(id, currentName) {
    // Legacy support (replaced by inlineEdit)
    const newName = prompt('상품명을 변경하시겠습니까?', currentName);
    if (newName && newName !== currentName) {
        await updateKeywordInfo(id, { keyword: newName });
    }
}

async function editPrice(id, currentPrice) {
    const newPrice = prompt('가격을 변경하시겠습니까?', currentPrice);
    if (newPrice !== null && !isNaN(newPrice.replace(/,/g,''))) {
        await updateKeywordInfo(id, { price: parseInt(newPrice.replace(/,/g,'')) });
    }
}

async function editMemo(id, date, currentMemo) {
    const newMemo = prompt(`${date} 비고란 수정:`, currentMemo);
    if (newMemo !== null && newMemo !== currentMemo) {
        const res = await fetch('api/dashboard/memo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywordId: id, date: date, memo: newMemo })
        });
        if (res.ok) loadKeywords(activeFolderId);
    }
}

async function updateKeywordInfo(id, data) {
    try {
        const res = await fetch('api/dashboard/update-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, ...data })
        });
        if (res.ok) {
            showToast('수정되었습니다.');
            if (activeFolderId) loadKeywords(activeFolderId);
        }
    } catch (err) {
        showToast('수정 실패');
    }
}
function setupEventListeners() {
    // MID Filter
    const midFilterSelect = document.getElementById('midFilterSelect');
    if (midFilterSelect) {
        midFilterSelect.addEventListener('change', filterKeywords);
    }

    // Excel upload
    const uploadBtn = document.getElementById('excelUploadBtn');
    const fileInput = document.getElementById('excelFile');
    
    if(uploadBtn) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            showToast('엑셀 업로드 중...');
            try {
                const url = activeFolderId ? `api/dashboard/excel-upload?folderId=${activeFolderId}` : `api/dashboard/excel-upload`;
                const res = await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    showToast('엑셀 업로드 완료!');
                    if (activeFolderId) {
                        loadKeywords(activeFolderId);
                    } else {
                        location.reload();
                    }
                } else {
                    const errorMsg = await res.text();
                    alert('업로드 실패: ' + errorMsg + '\n\n엑셀 형식을 확인해 주세요.\n(B열: 상품번호, G열: 유입수)');
                }
            } catch (err) {
                showToast('오류 발생');
            }
        };
    }
}

function triggerImageUpload(id) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('id', id);
        
        showToast('이미지 업로드 중...');
        try {
            const res = await fetch('api/dashboard/image-upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                showToast('이미지가 업데이트되었습니다.');
                loadKeywords(activeFolderId);
            } else {
                showToast('실패: ' + await res.text());
            }
        } catch (err) {
            showToast('오류 발생');
        }
    };
    input.click();
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

renderTableHeaders();
