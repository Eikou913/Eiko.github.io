// ==========================================
// 📜 DOM要素の取得
// ==========================================
const topScreen = document.getElementById('top-page-screen');
const myScreen = document.getElementById('my-page-screen');
const notebookOverlay = document.getElementById('notebook-overlay');
const canvasContainer = document.getElementById('canvas-container');
const myUiLayer = document.getElementById('my-ui-layer');

const floatingLabelsContainer = document.getElementById('floating-labels-container');
const cinematicFocus = document.getElementById('cinematic-focus');
const cinematicYear = document.getElementById('cinematic-year');
const cinematicText = document.getElementById('cinematic-text');

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
const closeNoteBtn = document.getElementById('close-note-btn');
const noteTitle = document.getElementById('note-title');
const noteEvents = document.getElementById('note-events');
const commentList = document.getElementById('comment-list');
const commentInput = document.getElementById('comment-input');
const commentSubmitBtn = document.getElementById('comment-submit-btn');

document.getElementById('input-sat').addEventListener('input', (e) => {
    document.getElementById('sat-val').textContent = e.target.value + '%';
});

// ==========================================
// 🌐 画面切り替え（ルーティング）
// ==========================================
topScreen.style.display = "block"; myScreen.style.display = "none";

toMyBtn.addEventListener('click', () => {
    topScreen.style.display = "none"; myScreen.style.display = "block";
    notebookOverlay.style.display = "flex"; notebookOverlay.classList.remove('opened');
    canvasContainer.style.display = "none"; myUiLayer.style.display = "none";
    floatingLabelsContainer.style.display = "none";
    toTopBtn.classList.remove('active'); toMyBtn.classList.add('active');
});

toTopBtn.addEventListener('click', () => {
    topScreen.style.display = "block"; myScreen.style.display = "none";
    toTopBtn.classList.add('active'); toMyBtn.classList.remove('active');
});

notebookOverlay.addEventListener('click', (event) => {
    event.stopPropagation(); notebookOverlay.classList.add('opened');
    setTimeout(() => {
        notebookOverlay.style.display = "none";
        canvasContainer.style.display = "block";
        myUiLayer.style.display = "block";
        floatingLabelsContainer.style.display = "block";
        updateDynamicViewportChunks(); refreshHappinessRanking();
        renderer.render(scene, camera);
    }, 1000); // フェードに合わせて少し遅らせる
});

menuToggleBtn.onclick = () => { controlPanel.classList.toggle('open'); analyticsPanel.classList.remove('open'); };
analyticsToggleBtn.onclick = () => { analyticsPanel.classList.toggle('open'); controlPanel.classList.remove('open'); };
panelCloseBtn.onclick = () => { controlPanel.classList.remove('open'); };
analyticsCloseBtn.onclick = () => { analyticsPanel.classList.remove('open'); };

// ==========================================
// 🪐 Three.js 空間セットアップ (Midnight Highway)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205); // 深い夜の黒
scene.fog = new THREE.FogExp2(0x020205, 0.025); // 奥を闇に沈める

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 8, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// 物理ベースレンダリングのための設定
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
canvasContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05; controls.target.set(0, 0, 0);

// ★ 夜の照明設定 ★
// 全体光を極端に暗くし、街灯やクリスタルが目立つようにする
const ambientLight = new THREE.AmbientLight(0x222233, 0.3); // 薄青い月の光程度
scene.add(ambientLight);

// ==========================================
// 📐 空間のインフラ (グリッド・道路・★街灯)
// ==========================================
// 1. 床のグリッド (暗めに)
const gridHelper = new THREE.GridHelper(400, 80, 0x11111a, 0x0a0a10);
gridHelper.position.y = -2;
scene.add(gridHelper);

// 2. 記憶のハイウェイ
const roadWidth = 10;
const roadLength = 800;
const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.8, metalness: 0.2 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0, -1.9, 0);
scene.add(road);

const centerLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.85, -400), new THREE.Vector3(0, -1.85, 400)]);
const centerLineMat = new THREE.LineDashedMaterial({ color: 0x555555, dashSize: 4, gapSize: 4 });
const centerLine = new THREE.Line(centerLineGeo, centerLineMat);
centerLine.computeLineDistances();
scene.add(centerLine);

const edgeGeo1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-roadWidth / 2, -1.85, -400), new THREE.Vector3(-roadWidth / 2, -1.85, 400)]);
const edgeGeo2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(roadWidth / 2, -1.85, -400), new THREE.Vector3(roadWidth / 2, -1.85, 400)]);
const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
scene.add(new THREE.Line(edgeGeo1, edgeMat));
scene.add(new THREE.Line(edgeGeo2, edgeMat));

// ★ 3. 街灯（Streetlights）の生成 ★
function createStreetlights() {
    const spacing = 50; // 街灯の間隔
    const zStart = -300;
    const zEnd = 100;
    const h = 10; // 高さ
    const xOffset = roadWidth / 2 + 1; // 道路のすぐ脇

    const poleGeo = new THREE.CylinderGeometry(0.1, 0.2, h, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });

    // 電球の光る部分
    const lampGeo = new THREE.BoxGeometry(1.5, 0.3, 0.5);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffaa00, emissiveIntensity: 2 });

    for (let z = zStart; z <= zEnd; z += spacing) {
        // 左側の街灯
        buildLamp(poleGeo, poleMat, lampGeo, lampMat, -xOffset, h, z, 1);
        // 右側の街灯 (間隔をずらして配置)
        buildLamp(poleGeo, poleMat, lampGeo, lampMat, xOffset, h, z + (spacing / 2), -1);
    }
}

function buildLamp(pGeo, pMat, lGeo, lMat, x, h, z, dirX) {
    const group = new THREE.Group();
    // 柱
    const pole = new THREE.Mesh(pGeo, pMat);
    pole.position.y = h / 2 - 2;
    group.add(pole);
    // ランプヘッド
    const head = new THREE.Mesh(lGeo, lMat);
    head.position.set(dirX * 0.5, h - 2, 0);
    group.add(head);

    // ★ スポットライト (道路を照らす)
    // 色, 強度, 距離, 角度, ボケ具合, 減衰率
    const light = new THREE.SpotLight(0xffaa00, 150, 60, Math.PI / 4, 0.8, 2);
    light.position.set(dirX * 0.5, h - 2.2, 0);
    light.target.position.set(dirX * 4, -2, z); // 道路の中央付近を狙う
    group.add(light);
    group.add(light.target);

    group.position.set(x, 0, z);
    scene.add(group);
}

createStreetlights();

// ==========================================
// 👑 マスターデータ
// ==========================================
const masterLifeRecords = [
    { id: 1, x_sat: 100, y_density: 3, date: "2008", events: ["おぎゃー！えいこう王国に生まれる👶✨"], comments: [] },
    { id: 2, x_sat: 95, y_density: 2, date: "2009", events: ["アンパンマンミュージアムにおでかけ🎡"], comments: ["楽しかった！"] },
    { id: 3, x_sat: 15, y_density: 3, date: "2011", events: ["インフルエンザにて演劇の主役を辞退💧"], comments: ["悔しかったな"] },
    { id: 4, x_sat: 85, y_density: 2, date: "2012", events: ["妖怪ウォッチにハマる👾"], comments: ["メダル集めた！"] },
    { id: 5, x_sat: 90, y_density: 2, date: "2013", events: ["ルービックキューブで6面をそろえる🧠"], comments: ["大成功！"] },
    { id: 6, x_sat: 80, y_density: 1, date: "2013", events: ["けんだまにハマる🔴"], comments: ["もしもしかめよ"] },
    { id: 7, x_sat: 95, y_density: 3, date: "2026", events: ["Tunecore運営と面談🤝"], comments: ["未来への一歩。"] },
    { id: 8, x_sat: 60, y_density: 2, date: "2026", events: ["学校を退学する。"], comments: ["自分で決めた道。"] }
];

function getCalculatedZ(data, index) {
    if (timelineScaleSelect.value === 'custom') { return -index * 8.0; } // 間隔を広めに
    const year = parseInt(data.date.split('.')[0]);
    return -(year - 2008) * 12;
}
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0xf472b6; // ピンク
    if (sat >= 40) return 0x38bdf8; // ブルー
    return 0x94a3b8; // グレー
}

// ==========================================
// 🌟 空間オブジェクト生成 ＆ 星座線
// ==========================================
const nodeGeometry = new THREE.IcosahedronGeometry(0.8, 0);
const activeObjectsMap = new Map();
const clickableObjects = [];
let constellationLine = null;
const floatingLabels = [];

function updateDynamicViewportChunks() {
    for (let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); }
    activeObjectsMap.clear(); clickableObjects.length = 0; floatingLabels.length = 0;
    floatingLabelsContainer.innerHTML = '';
    if (constellationLine) scene.remove(constellationLine);

    if (masterLifeRecords.length === 0) return;

    const points = [];
    const zPositions = masterLifeRecords.map((r, i) => getCalculatedZ(r, i));
    const maxZ = Math.max(...zPositions); const minZ = Math.min(...zPositions);

    masterLifeRecords.forEach((data, index) => {
        const tZ = getCalculatedZ(data, index); const group = new THREE.Group();
        const xPos = ((data.x_sat / 100) * 24) - 12;
        const yPos = data.y_density * 2.0;
        let displayColor = getColorBySatisfaction(data.x_sat);

        // ノード本体 (自ら発光させる)
        const nodeMat = new THREE.MeshStandardMaterial({
            color: displayColor, emissive: displayColor, emissiveIntensity: 1.5, wireframe: true
        });
        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMat);
        const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        nodeMesh.add(coreMesh); nodeMesh.position.set(xPos, yPos, tZ); group.add(nodeMesh);

        // ★ クリスタル自体にポイントライトを追加して周囲を照らす
        const pointLight = new THREE.PointLight(displayColor, 50, 15);
        pointLight.position.set(xPos, yPos, tZ);
        group.add(pointLight);

        points.push(new THREE.Vector3(xPos, yPos, tZ));

        // 地面(道路)から伸びる光の柱
        const pillarGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos, -1.8, tZ), new THREE.Vector3(xPos, yPos, tZ)]);
        const pillarMat = new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.5 });
        group.add(new THREE.Line(pillarGeo, pillarMat));

        // 浮かぶテキストラベル
        const label = document.createElement('div');
        label.className = 'floating-label';
        const hexColor = '#' + displayColor.toString(16).padStart(6, '0');
        label.style.borderLeftColor = hexColor;
        label.innerHTML = `<strong style="color:${hexColor}; font-family:'Share Tech Mono';">${data.date}</strong><br>${data.events[0]}`;
        floatingLabelsContainer.appendChild(label);
        floatingLabels.push({ element: label, position: new THREE.Vector3(xPos, yPos + 1.5, tZ) });

        nodeMesh.userData = { ...data, index, colorHex: displayColor };
        clickableObjects.push(nodeMesh); scene.add(group); activeObjectsMap.set(`node_${data.id}`, group);
    });

    // 🌟 人生の軌跡を描く星座線
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    constellationLine = new THREE.Line(lineGeo, lineMat);
    scene.add(constellationLine);

    timelineSlider.min = minZ - 20; timelineSlider.max = maxZ + 20; timelineSlider.value = controls.target.z;
}

// ==========================================
// UI機能全般 (ランキング、追加、クリックなど)
// ==========================================
rankingPeriodSelect.addEventListener('change', refreshHappinessRanking);
function refreshHappinessRanking() {
    const period = rankingPeriodSelect.value;
    const filteredRecords = masterLifeRecords.filter(rec => { if (period === 'all') return true; return rec.date === period; });
    filteredRecords.sort((a, b) => b.x_sat - a.x_sat);
    let html = "";
    if (filteredRecords.length === 0) { html = `<div style="font-size:12px; text-align:center; color:#94a3b8; padding:20px;">NO RECORDS FOUND.</div>`; }
    else {
        filteredRecords.forEach((rec, index) => {
            const rankNum = index + 1; let badgeClass = rankNum === 1 ? "rank-1" : rankNum === 2 ? "rank-2" : rankNum === 3 ? "rank-3" : "rank-other";
            html += `
                <div class="ranking-item" onclick="warpToRecordFromRanking(${rec.id})">
                    <div class="rank-badge ${badgeClass}">${rankNum}</div>
                    <div class="rank-date">YEAR ${rec.date}</div>
                    <div class="rank-score">${rec.x_sat}%</div>
                </div>`;
        });
    }
    rankingListContainer.innerHTML = html;
}

window.warpToRecordFromRanking = function (id) {
    const recIdx = masterLifeRecords.findIndex(r => r.id === id);
    if (recIdx > -1) { analyticsPanel.classList.remove('open'); warpToZCoordinate(getCalculatedZ(masterLifeRecords[recIdx], recIdx)); }
};

timelineSlider.addEventListener('mousedown', () => { controls.enabled = false; });
timelineSlider.addEventListener('mouseup', () => { controls.enabled = true; });
timelineSlider.addEventListener('touchstart', () => { controls.enabled = false; }, { passive: true });
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
    const eventText = document.getElementById('input-event').value || "（NO DATA）";
    if (!date) return;
    masterLifeRecords.push({ id: Date.now(), x_sat: sat, y_density: 2, date: date, events: [eventText], comments: [] });
    updateDynamicViewportChunks(); refreshHappinessRanking();
    warpToZCoordinate(getCalculatedZ(masterLifeRecords[masterLifeRecords.length - 1], masterLifeRecords.length - 1));
    document.getElementById('input-event').value = ""; controlPanel.classList.remove('open');
});

// クリック判定 (Raycaster)
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
let startX = 0; let startY = 0; let selectedNode = null;

window.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; }, false);
window.addEventListener('pointerup', (e) => {
    if (myUiLayer.style.display === "none" || canvasContainer.style.display === "none") return;
    if (!e.target || typeof e.target.closest !== 'function') return;
    if (e.target.closest('#app-nav') || e.target.closest('.float-btn') || e.target.closest('.side-panel') || e.target.closest('#timeline-scrollbar-container') || e.target.closest('#sticky-note')) return;
    if (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera); const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        selectedNode = intersects[0].object; const data = selectedNode.userData;
        const hexColor = '#' + data.colorHex.toString(16).padStart(6, '0');
        stickyNote.style.borderLeftColor = hexColor;
        noteTitle.innerHTML = `<span style="color:${hexColor}; font-weight:bold; font-family:'Share Tech Mono';">DATE: ${data.date}</span> <span style="font-size:10px; color:var(--text-sub); float:right;">SAT: ${data.x_sat}%</span>`;
        noteEvents.innerHTML = `<div style="font-size:13px; margin-bottom:10px;">${data.events[0]}</div>`;
        stickyNote.style.display = 'block';
        renderComments(data); updateNotePosition();
    } else { closeNote(); }
}, false);

function renderComments(record) { commentList.innerHTML = record.comments.map(c => `<div class="comment-item">${c}</div>`).join(''); }
commentSubmitBtn.onclick = () => {
    if (!commentInput.value || !selectedNode) return;
    const record = masterLifeRecords.find(r => r.id === selectedNode.userData.id);
    record.comments.push(commentInput.value); renderComments(record); commentInput.value = "";
};

function updateNotePosition() {
    if (!selectedNode || stickyNote.style.display === 'none') return;
    const pos = new THREE.Vector3(); selectedNode.getWorldPosition(pos); pos.y += 1.5; pos.project(camera);
    stickyNote.style.left = `${(pos.x * .5 + .5) * window.innerWidth}px`; stickyNote.style.top = `${(pos.y * -.5 + .5) * window.innerHeight}px`;
}
function closeNote() { stickyNote.style.display = 'none'; selectedNode = null; }
closeNoteBtn.onclick = closeNote;

let isWarping = false; let targetCameraZ = 0; let targetControlsTargetZ = 0;
// 夜のハイウェイを走るようなカメラワーク
function warpToZCoordinate(zPos) {
    targetCameraZ = zPos + 18;
    targetControlsTargetZ = zPos;
    isWarping = true;
    closeNote();
}

// 🎬 シネマティック・フォーカス
function updateCinematicFocus() {
    if (clickableObjects.length === 0) return;
    let minDiff = Infinity; let nearestData = null;
    clickableObjects.forEach(obj => {
        const diff = Math.abs(obj.position.z - controls.target.z);
        if (diff < minDiff) { minDiff = diff; nearestData = obj.userData; }
    });

    if (nearestData) {
        cinematicYear.textContent = nearestData.date;
        cinematicText.textContent = nearestData.events[0];
        const hexColor = '#' + nearestData.colorHex.toString(16).padStart(6, '0');
        cinematicYear.style.color = hexColor;
        cinematicYear.style.textShadow = `0 0 15px ${hexColor}`;
    }
}

// ==========================================
// 🔄 メインループ
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    if (canvasContainer.style.display === "block") {
        if (isWarping) {
            camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
            controls.target.z += (targetControlsTargetZ - controls.target.z) * 0.08;
            camera.position.y += (6 - camera.position.y) * 0.05; // 道路を低く這うような視点に
            camera.position.x += (0 - camera.position.x) * 0.05;

            timelineSlider.value = controls.target.z; camZValText.textContent = controls.target.z.toFixed(1);
            if (Math.abs(camera.position.z - targetCameraZ) < 0.1) { camera.position.z = targetCameraZ; controls.target.set(0, 0, targetControlsTargetZ); isWarping = false; }
        } else {
            timelineSlider.value = controls.target.z; camZValText.textContent = controls.target.z.toFixed(1);
        }
        controls.update();

        clickableObjects.forEach(obj => { obj.rotation.y += 0.01; obj.rotation.z += 0.005; });

        updateCinematicFocus();

        floatingLabels.forEach(labelData => {
            const pos = labelData.position.clone(); pos.project(camera);
            if (pos.z > 1) { labelData.element.classList.remove('visible'); return; }

            const x = (pos.x * .5 + .5) * window.innerWidth;
            const y = (pos.y * -.5 + .5) * window.innerHeight;
            labelData.element.style.left = `${x}px`; labelData.element.style.top = `${y}px`;

            const dist = camera.position.distanceTo(labelData.position);
            // 近すぎず遠すぎない距離でラベルを表示
            if (dist > 12 && dist < 70) {
                labelData.element.classList.add('visible');
            } else {
                labelData.element.classList.remove('visible');
            }
        });

        updateNotePosition(); renderer.render(scene, camera);
    }
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});