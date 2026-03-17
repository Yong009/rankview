document.addEventListener('DOMContentLoaded', function() {
    initHistory();
});

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let allFolders = [];
let activeFolderId = null;

async function initHistory() {
    setupMonthSelector();
    await loadFolders();
    setupEventListeners();
}

function setupMonthSelector() {
    updateMonthDisplay();
    document.getElementById('prevMonth').onclick = () => changeMonth(-1);
    document.getElementById('nextMonth').onclick = () => changeMonth(1);
}

function updateMonthDisplay() {
    document.getElementById('currentMonthDisplay').textContent = `${currentYear}년 ${currentMonth}월`;
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
    updateMonthDisplay();
    if (activeFolderId) loadKeywordsRecursive(activeFolderId);
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
    const rootFolders = allFolders.filter(f => !f.parentId);
    rootFolders.forEach(folder => {
        renderFolderTree(folder, listEl, 0);
    });
}

function renderFolderTree(folder, container, depth) {
    const li = document.createElement('li');
    li.className = `folder-item ${folder.id === activeFolderId ? 'active' : ''}`;
    li.style.paddingLeft = `${depth * 20 + 16}px`;
    
    li.innerHTML = `
        <i class="fas ${allFolders.some(f => f.parentId === folder.id) ? 'fa-folder' : 'fa-folder-open'}"></i>
        <span>${folder.name}</span>
    `;

    li.onclick = () => {
        activeFolderId = folder.id;
        document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        loadKeywordsRecursive(folder.id);
    };

    container.appendChild(li);
    allFolders.filter(f => f.parentId === folder.id).forEach(child => renderFolderTree(child, container, depth + 1));
}

async function loadKeywordsRecursive(parentId) {
    try {
        const folderIds = getAllChildFolderIds(parentId);
        let allKeywords = [];
        for (let fid of folderIds) {
            const res = await fetch(`api/keywords/folder/${fid}`);
            if (res.ok) allKeywords = allKeywords.concat(await res.json());
        }

        // Fetch daily data for each keyword
        for (let k of allKeywords) {
            const dailyRes = await fetch(`api/dashboard/data/${k.id}?year=${currentYear}&month=${currentMonth}`);
            k.dailyData = dailyRes.ok ? await dailyRes.json() : [];
        }

        renderHistoryCards(allKeywords);
        document.getElementById('currentFolderName').textContent = allFolders.find(f => f.id == parentId)?.name || '기본 폴더';
    } catch (error) {
        console.error('Error loading history data:', error);
    }
}

function getAllChildFolderIds(parentId) {
    let ids = [parentId];
    allFolders.filter(f => f.parentId == parentId).forEach(child => {
        ids = ids.concat(getAllChildFolderIds(child.id));
    });
    return ids;
}

function renderHistoryCards(keywords) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = '';
    
    if (keywords.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #a0aec0;">데이터가 없습니다.</div>';
        return;
    }

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    keywords.forEach(k => {
        const card = document.createElement('div');
        card.className = 'history-card';
        
        let html = `
            <div class="history-card-header">
                <img src="${k.imageUrl || 'https://via.placeholder.com/80'}" class="history-prod-img" onerror="this.src='https://via.placeholder.com/80';">
                <div class="history-prod-info">
                    <h3>${k.productName || k.keyword}</h3>
                    <p>상품번호(MID): ${k.mid || '-'} | 검색 키워드: ${k.keyword}</p>
                </div>
            </div>
            <div class="history-table-wrapper">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>구분</th>
                            ${Array.from({length: daysInMonth}, (_, i) => `<th>${i+1}일</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="font-weight:700; background:#f8fafc;">순위</td>
                            ${Array.from({length: daysInMonth}, (_, i) => {
                                const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
                                const data = k.dailyData.find(d => d.date === dateStr);
                                let rankText = '-';
                                let cellClass = '';
                                if (data?.rank) {
                                    if (data.rank === -1) {
                                        rankText = '밖';
                                    } else {
                                        rankText = data.rank;
                                        if (data.rank <= 10) cellClass = 'rank-top10';
                                    }
                                }
                                return `<td class="${cellClass}">${rankText}</td>`;
                            }).join('')}
                        </tr>
                        <tr>
                            <td style="font-weight:700; background:#f8fafc;">비고</td>
                            ${Array.from({length: daysInMonth}, (_, i) => {
                                const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
                                const data = k.dailyData.find(d => d.date === dateStr);
                                return `<td style="max-width:60px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${data?.dailyMemo || ''}">${data?.dailyMemo || ''}</td>`;
                            }).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        card.innerHTML = html;
        container.appendChild(card);
    });

    document.getElementById('itemCount').textContent = keywords.length;
}

function setupEventListeners() {
    // Basic setup needed if any
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
