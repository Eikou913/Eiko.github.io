/**
 * 👑 3D Life Chronology - Core Engine [Perfect Final Bugless]
 * 致命的なタイポを完全修正 ＆ 画面切り替え・クリック判定安定版
 */

// ==========================================
// 📜 1. 全てのDOM要素の取得（最上部へ集約）
// ==========================================
const topScreen = document.getElementById('top-page-screen');
const myScreen = document.getElementById('my-page-screen');

const notebookOverlay = document.getElementById('notebook-overlay');
const canvasContainer = document.getElementById('canvas-container');
const myUiLayer = document.getElementById('my-ui-layer');

const toTopBtn = document.getElementById('to-top-btn');
const toMyBtn = document.getElementById('to-my-btn');

const menuToggleBtn = document.getElementById('menu-toggle-btn');
const controlPanel = document.getElementById('control-panel');
const panelCloseBtn = document.getElementById('panel-close-btn');

const analyticsToggleBtn = document.getElementById('analytics-toggle-btn');
const analyticsPanel = document.getElementById('analytics-panel');
const analyticsCloseBtn = document.getElementById('analytics-close-btn');

const timelineSlider = document.getElementById('timeline-slider');
const camZValText = document.getElementById('cam-z-val');
const timelineScaleSelect = document.getElementById('timeline-scale');

const rankingPeriodSelect = document.getElementById('ranking-period');
const rankingListContainer = document.getElementById('ranking-list-container');
const addBtn = document.getElementById('add-btn');

const stickyNote = document.getElementById('sticky-note');
const noteTitle = document.getElementById('note-title');
const noteEvents = document.getElementById('note-events');
const commentList = document.getElementById('comment-list');
const commentInput = document.getElementById('comment-input');
const commentSubmitBtn = document.getElementById('comment-submit-btn');

// ==========================================
// 🌐 2. 画面切り替え（Topポータル ⇄ My手帳）の完璧な進路制御
// ==========================================

// アプリ起動時の初期表示状態を固定
topScreen.style.display = "block";
myScreen.style.display = "none";

// 【Myタブをクリックした時】➔ いつでも手帳の表紙を出す
toMyBtn.addEventListener('click', () => {
    topScreen.style.display = "none";
    myScreen.style.display = "block";
    
    // 状態リセット：宇宙と3D側のUIは一旦隠し、手帳の表紙をクッキリ出す
    notebookOverlay.style.display = "flex";
    notebookOverlay.classList.remove('opened');
    canvasContainer.style.display = "none";
    myUiLayer.style.display = "none";
    
    toTopBtn.classList.remove('active');
    toMyBtn.classList.add('active');
});

// 【Topタブをクリックした時】➔ いつでも最初のポータル広場へ戻る
toTopBtn.addEventListener('click', () => {
    topScreen.style.display = "block";
    myScreen.style.display = "none";
    
    toTopBtn.classList.add('active');
    toMyBtn.classList.remove('active');
});

// 【手帳の表紙をクリックした時】➔ 3D宇宙へワープ開始
notebookOverlay.addEventListener('click', (event) => {
    event.stopPropagation();
    
    // 表紙をフワッと消す
    notebookOverlay.classList.add('opened');
    
    // 0.5秒後に完全に3D宇宙とUIを立ち上げる
    setTimeout(() => {
        notebookOverlay.style.display = "none";
        canvasContainer.style.display = "block";
        myUiLayer.style.display = "block";
        
        // 3Dデータの組み立て
        updateDynamicViewportChunks();
        refreshHappinessRanking();

        // 💡【ここを追加！】画面が出現した瞬間に、強制的に1回目の3D描写を走らせて真っ暗をスキップ！
        renderer.render(scene, camera);
        
    }, 500);
});

// ==========================================
// 📱 3. 左右引き出しパネル開閉システム
// ==========================================
menuToggleBtn.onclick = () => {
    controlPanel.classList.toggle('open');
    analyticsPanel.classList.remove('open');
};

analyticsToggleBtn.onclick = () => {
    analyticsPanel.classList.toggle('open');
    controlPanel.classList.remove('open');
};

panelCloseBtn.onclick = () => { controlPanel.classList.remove('open'); };
analyticsCloseBtn.onclick = () => { analyticsPanel.classList.remove('open'); };

// ==========================================
// 🪐 4. Three.js 3D空間のセットアップ
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff0f3);
scene.fog = new THREE.FogExp2(0xfff0f3, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 💡【大修正】タイポを canvasContainer に完全修正。これでCanvasが正しくDOMに追加されます！
canvasContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffeef2, 0.8); dirLight.position.set(15, 25, 15); scene.add(dirLight);

// ==========================================
// 👑 5. マスター年表データ
// ==========================================
const masterLifeRecords = [
    { id: 1, x_sat: 100, y_density: 3, date: "2008", events: ["おぎゃー！栄光王国に生まれる👶✨"], comments: [] },
    { id: 2, x_sat: 95, y_density: 2, date: "2009", events: ["アンパンマンミュージアムにおでかけ🎡"], comments: ["楽しかった！"] },
    { id: 3, x_sat: 15, y_density: 3, date: "2011", events: ["インフルエンザにて演劇の主役を辞退💧"], comments: ["悔しかったな"] },
    { id: 4, x_sat: 85, y_density: 2, date: "2012", events: ["妖怪ウォッチにハマる👾"], comments: ["メダル集めた！"] },
    { id: 5, x_sat: 90, y_density: 2, date: "2013", events: ["ルービックキューブで6面をそろえる🧠"], comments: ["大成功！"] },
    { id: 6, x_sat: 80, y_density: 1, date: "2013", events: ["けんだまにハマる🔴"], comments: ["もしもしかめよ"] },
    { id: 7, x_sat: 95, y_density: 3, date: "2026", events: ["Tunecore運営と面談🤝"], comments: ["未来への一歩。"] },
    { id: 8, x_sat: 60, y_density: 2, date: "2026", events: ["学校を退学する。"], comments: ["自分で決めた道。"] }
];

function getCalculatedZ(data, index) {
    if (timelineScaleSelect.value === 'custom') { return -index * 4.5; }
    const year = parseInt(data.date.split('.')[0]);
    return -(year - 2008) * 12;
}

function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0xff758f; if (sat >= 40) return 0xffca3a; return 0x90e0ef;
}

// ==========================================
// 🌟 6. 3D星型プロットシステム
// ==========================================
function createStarGeometry() {
    const shape = new THREE.Shape(); const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? 0.55 : 0.23; const angle = (i / (spikes * 2)) * Math.PI * 2;
        const x = Math.cos(angle - Math.PI/2) * radius; const y = Math.sin(angle - Math.PI/2) * radius;
        if(i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    return new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 });
}
const starGeometry = createStarGeometry();

const activeObjectsMap = new Map(); const clickableObjects = [];
const spotTickGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24).rotateX(Math.PI / 2);

function updateDynamicViewportChunks() {
    for (let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); }
    activeObjectsMap.clear(); clickableObjects.length = 0;
    if (masterLifeRecords.length === 0) return;

    const zPositions = masterLifeRecords.map((r, i) => getCalculatedZ(r, i));
    const maxZ = Math.max(...zPositions); const minZ = Math.min(...zPositions); 

    const lineGeom = new THREE.CylinderGeometry(0.04, 0.04, Math.abs(maxZ - minZ) + 12, 32).rotateX(Math.PI / 2);
    const timelineLine = new THREE.Mesh(lineGeom, new THREE.MeshStandardMaterial({ color: 0xffd6ba, emissive: 0xffb3c6, emissiveIntensity: 0.2 }));
    timelineLine.position.set(0, 0, (maxZ + minZ) / 2); scene.add(timelineLine); activeObjectsMap.set("built_line", timelineLine);

    masterLifeRecords.forEach((data, index) => {
        const tZ = getCalculatedZ(data, index); const group = new THREE.Group(); const xPos = ((data.x_sat / 100) * 16) - 8;
        let displayColor = getColorBySatisfaction(data.x_sat);

        const starMesh = new THREE.Mesh(starGeometry, new THREE.MeshStandardMaterial({ color: displayColor, emissive: displayColor, emissiveIntensity: 0.3 }));
        starMesh.position.set(xPos, data.y_density * 1.5, tZ); group.add(starMesh);

        const spotTick = new THREE.Mesh(spotTickGeom, new THREE.MeshBasicMaterial({ color: displayColor })); spotTick.position.set(0, 0, tZ); group.add(spotTick);

        starMesh.userData = { ...data, index }; clickableObjects.push(starMesh); scene.add(group); activeObjectsMap.set(`node_${data.id}`, group);
    });

    timelineSlider.min = minZ - 20; timelineSlider.max = maxZ + 20;
    timelineSlider.value = controls.target.z;
}

// ==========================================
// 🏆 7. ランキングシステム
// ==========================================
rankingPeriodSelect.addEventListener('change', refreshHappinessRanking);

function refreshHappinessRanking() {
    const period = rankingPeriodSelect.value;
    const filteredRecords = masterLifeRecords.filter(rec => {
        if (period === 'all') return true;
        return rec.date === period;
    });
    filteredRecords.sort((a, b) => b.x_sat - a.x_sat);

    let html = "";
    if (filteredRecords.length === 0) {
        html = `<div style="font-size:11px; text-align:center; color:#a39296; padding:10px;">きろくがありません🧸</div>`;
    } else {
        filteredRecords.forEach((rec, index) => {
            const rankNum = index + 1; let badgeClass = rankNum === 1 ? "rank-1" : rankNum === 2 ? "rank-2" : rankNum === 3 ? "rank-3" : "rank-other";
            html += `
                <div class="ranking-item" onclick="warpToRecordFromRanking(${rec.id})">
                    <div class="rank-badge ${badgeClass}">${rankNum}</div>
                    <div class="rank-date">${rec.date}年の出来事</div>
                    <div class="rank-score">${rec.x_sat}%</div>
                </div>
            `;
        });
    }
    rankingListContainer.innerHTML = html;
}

window.warpToRecordFromRanking = function(id) {
    const recIdx = masterLifeRecords.findIndex(r => r.id === id);
    if(recIdx > -1) { analyticsPanel.classList.remove('open'); warpToZCoordinate(getCalculatedZ(masterLifeRecords[recIdx], recIdx)); }
};

// ==========================================
// ⏳ 8. Z軸タイムラインスクロールバー連動
// ==========================================
timelineSlider.addEventListener('mousedown', () => { controls.enabled = false; });
timelineSlider.addEventListener('mouseup', () => { controls.enabled = true; });
timelineSlider.addEventListener('touchstart', () => { controls.enabled = false; }, {passive: true});
timelineSlider.addEventListener('touchend', () => { controls.enabled = true; });

timelineSlider.addEventListener('input', () => {
    if (isWarping) isWarping = false;
    const val = parseFloat(timelineSlider.value);
    const currentDiffZ = camera.position.z - controls.target.z;
    controls.target.z = val; camera.position.z = val + currentDiffZ;
    camZValText.textContent = val.toFixed(1);
});

timelineScaleSelect.addEventListener('change', () => { updateDynamicViewportChunks(); warpToZCoordinate(getCalculatedZ(masterLifeRecords[0], 0)); });

addBtn.addEventListener('click', () => {
    const date = document.getElementById('input-date').value; const sat = parseInt(document.getElementById('input-sat').value);
    const eventText = document.getElementById('input-event').value || "（イベントなし）";
    if(!date) return;
    
    masterLifeRecords.push({ id: Date.now(), x_sat: sat, y_density: 2, date: date, events: [eventText], comments: [] });
    updateDynamicViewportChunks(); refreshHappinessRanking();
    warpToZCoordinate(getCalculatedZ(masterLifeRecords[masterLifeRecords.length - 1], masterLifeRecords.length - 1));
    document.getElementById('input-event').value = ""; controlPanel.classList.remove('open');
});

// ==========================================
// 🎯 9. クリック判定エラーの完全防御 ＆ コメント
// ==========================================
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
let startX = 0; let startY = 0;

window.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; }, false);
window.addEventListener('pointerup', (e) => {
    if (myUiLayer.style.display === "none" || canvasContainer.style.display === "none") return;
    if (!e.target || typeof e.target.closest !== 'function') return;

    if (e.target.closest('#app-nav') || e.target.closest('.float-btn') || e.target.closest('.side-panel') || e.target.closest('#timeline-scrollbar-container') || e.target.closest('#sticky-note')) {
        return; 
    }

    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) return; // 画面回転ドラッグは無視

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        selectedStar = intersects[0].object; const data = selectedStar.userData;
        noteTitle.innerHTML = `<span>📅 ${data.date}年</span> <span style="font-size:10px; color:#8a7a7f;">満足度: ${data.x_sat}%</span>`;
        noteEvents.innerHTML = `<div class="event-item">${data.events[0]}</div>`;
        stickyNote.style.display = 'block';
        renderComments(data); updateNotePosition();
    } else { closeNote(); }
}, false);

function renderComments(record) {
    commentList.innerHTML = record.comments.map(c => `<div class="comment-item">${c}</div>`).join('');
}

commentSubmitBtn.onclick = () => {
    if (!commentInput.value || !selectedStar) return;
    const record = masterLifeRecords.find(r => r.id === selectedStar.userData.id);
    record.comments.push(commentInput.value); renderComments(record); commentInput.value = "";
};

function updateNotePosition() {
    if (!selectedStar || stickyNote.style.display === 'none') return;
    const pos = new THREE.Vector3(); selectedStar.getWorldPosition(pos); pos.y += 0.5; pos.project(camera);
    stickyNote.style.left = `${(pos.x * .5 + .5) * window.innerWidth}px`; stickyNote.style.top = `${(pos.y * -.5 + .5) * window.innerHeight}px`;
}
function closeNote() { stickyNote.style.display = 'none'; selectedStar = null; }

let isWarping = false; let targetCameraZ = 0; let targetControlsTargetZ = 0;
function warpToZCoordinate(zPos) { targetCameraZ = zPos + 25; targetControlsTargetZ = zPos; isWarping = true; closeNote(); }

// ==========================================
// 🔄 10. メイン描画ループ
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    
    // 💡 画面が切り替わって宇宙が表示された時だけ処理をする
    if (canvasContainer.style.display === "block") {
        if (isWarping) {
            camera.position.z += (targetCameraZ - camera.position.z) * 0.08; controls.target.z += (targetControlsTargetZ - controls.target.z) * 0.08;
            timelineSlider.value = controls.target.z; camZValText.textContent = controls.target.z.toFixed(1);
            if (Math.abs(camera.position.z - targetCameraZ) < 0.1) { camera.position.z = targetCameraZ; controls.target.set(0, 1, targetControlsTargetZ); isWarping = false; }
        } else {
            timelineSlider.value = controls.target.z; camZValText.textContent = controls.target.z.toFixed(1);
        }
        controls.update();
        clickableObjects.forEach(obj => { obj.rotation.y += 0.012; });
        updateNotePosition(); renderer.render(scene, camera);
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});