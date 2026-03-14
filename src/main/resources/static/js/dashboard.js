document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1-indexed

let allFolders = [];
let activeFolderId = null;

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
        
        // As per requirement: "맨 마지막 폴더를 클릭하면 맨 마지막에 들어있는 키워드만 보이면 됩니다"
        if (!hasChildren) {
            loadKeywords(folder.id);
        } else {
            // Clear table or show nothing?
            document.getElementById('keywordTableBody').innerHTML = '';
        }
    };

    container.appendChild(li);
    children.forEach(child => renderFolderTree(child, container, depth + 1));
}

async function loadKeywords(folderId) {
    try {
        const response = await fetch(`api/keywords/folder/${folderId}`);
        const keywords = await response.json();
        
        // Fetch daily data for each keyword
        for (let k of keywords) {
            const dailyRes = await fetch(`api/dashboard/data/${k.id}?year=${currentYear}&month=${currentMonth}`);
            k.dailyData = await dailyRes.json();
        }
        
        renderKeywords(keywords);
    } catch (error) {
        console.error('Error loading keywords:', error);
    }
}

function renderTableHeaders() {
    const headerRow = document.getElementById('tableHeaderRow');
    // Clear dynamic columns
    // Fixed columns: Checkbox(0), Image(1), Info(2)
    while (headerRow.children.length > 3) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        const th = document.createElement('th');
        th.textContent = `${i}일`;
        th.style.minWidth = '70px';
        headerRow.appendChild(th);
    }
}

function renderKeywords(keywords) {
    const tbody = document.getElementById('keywordTableBody');
    tbody.innerHTML = '';
    
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    keywords.forEach(k => {
        const tr = document.createElement('tr');
        
        // Fixed Columns
        let html = `
            <td><input type="checkbox" class="row-checkbox" data-id="${k.id}"></td>
            <td>
                <div class="img-square-container img-upload-trigger" onclick="triggerImageUpload(${k.id})">
                    ${k.imageUrl ? 
                        `<img src="${k.imageUrl}" class="img-thumbnail" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'img-placeholder\'><i class=\'fas fa-plus\'></i></div>'">` : 
                        `<div class="img-placeholder"><i class="fas fa-plus"></i></div>`
                    }
                </div>
            </td>
            <td class="product-info-cell">
                <div class="product-info-horizontal">
                    <span class="info-folder">${getParentFolderName(k.folderId)}</span>
                    <span class="info-divider">|</span>
                    <div class="info-keyword-wrap">
                        <span class="info-keyword editable-text" onclick="editKeywordName(${k.id}, '${k.keyword}')">${k.keyword}</span>
                        <span class="rank-indicator">${renderRankChange(k.rankChange)}</span>
                    </div>
                    <span class="info-divider">|</span>
                    <span class="info-price editable-text" onclick="editPrice(${k.id}, ${k.price})">${k.price.toLocaleString()}원</span>
                </div>
            </td>
        `;
        
        // Daily Data Columns
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const dayData = k.dailyData.find(d => d.date === dateStr) || { inflowCount: 0, dailyMemo: '' };
            
            html += `
                <td>
                    <div class="cell-container">
                        <div class="inflow-row">${dayData.inflowCount || 0}</div>
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

    document.getElementById('itemCount').textContent = keywords.length;
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
async function editKeywordName(id, currentName) {
    const newName = prompt('상품명을 변경하시겠습니까?', currentName);
    if (newName && newName !== currentName) {
        await updateKeywordInfo(id, { keyword: newName });
    }
}

async function editPrice(id, currentPrice) {
    const newPrice = prompt('가격을 변경하시겠습니까?', currentPrice);
    if (newPrice !== null && !isNaN(newPrice)) {
        await updateKeywordInfo(id, { price: parseInt(newPrice) });
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
    const res = await fetch('api/dashboard/update-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, ...data })
    });
    if (res.ok) loadKeywords(activeFolderId);
}

function setupEventListeners() {
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
                const res = await fetch('api/dashboard/excel-upload', {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    showToast('업로드 완료!');
                    if (activeFolderId) loadKeywords(activeFolderId);
                } else {
                    showToast('업로드 실패: ' + await res.text());
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
