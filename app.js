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
    }, 1000);
});

menuToggleBtn.onclick = () => { controlPanel.classList.toggle('open'); analyticsPanel.classList.remove('open'); };
analyticsToggleBtn.onclick = () => { analyticsPanel.classList.toggle('open'); controlPanel.classList.remove('open'); };
panelCloseBtn.onclick = () => { controlPanel.classList.remove('open'); };
analyticsCloseBtn.onclick = () => { analyticsPanel.classList.remove('open'); };

// ==========================================
// 🪐 Three.js 空間セットアップ (Midnight Highway)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020205);
// ★フォグを少し薄くして、遠くの過去(Z軸の奥)まで見えるように調整
scene.fog = new THREE.FogExp2(0x020205, 0.008);

// ★カメラの限界を 1000 から 5000 に拡張し、長期間の記録を描画可能に
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(12, 8, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
canvasContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05; controls.target.set(0, 0, 0);

const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
scene.add(ambientLight);

// ==========================================
// 📐 空間のインフラ (グリッド・道路・街灯)
// ==========================================
const gridHelper = new THREE.GridHelper(400, 80, 0x11111a, 0x0a0a10);
gridHelper.position.y = -2;
scene.add(gridHelper);

const roadWidth = 10;
const roadLength = 6000; // 道路をかなり奥まで伸ばす
const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x050508, roughness: 0.8, metalness: 0.2 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.position.set(0, -1.9, -1000); // 中心を奥にずらす
scene.add(road);

const centerLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.85, -3000), new THREE.Vector3(0, -1.85, 500)]);
const centerLineMat = new THREE.LineDashedMaterial({ color: 0x555555, dashSize: 4, gapSize: 4 });
const centerLine = new THREE.Line(centerLineGeo, centerLineMat);
centerLine.computeLineDistances();
scene.add(centerLine);

const edgeGeo1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-roadWidth / 2, -1.85, -3000), new THREE.Vector3(-roadWidth / 2, -1.85, 500)]);
const edgeGeo2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(roadWidth / 2, -1.85, -3000), new THREE.Vector3(roadWidth / 2, -1.85, 500)]);
const edgeMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 });
scene.add(new THREE.Line(edgeGeo1, edgeMat));
scene.add(new THREE.Line(edgeGeo2, edgeMat));

// ★街灯の生成範囲も過去方向へ拡張
function createStreetlights() {
    const spacing = 60;
    const zStart = -2500;
    const zEnd = 100;
    const h = 10;
    const xOffset = roadWidth / 2 + 1;

    const poleGeo = new THREE.CylinderGeometry(0.1, 0.2, h, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const lampGeo = new THREE.BoxGeometry(1.5, 0.3, 0.5);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffaa00, emissiveIntensity: 2 });

    for (let z = zStart; z <= zEnd; z += spacing) {
        buildLamp(poleGeo, poleMat, lampGeo, lampMat, -xOffset, h, z, 1);
        buildLamp(poleGeo, poleMat, lampGeo, lampMat, xOffset, h, z + (spacing / 2), -1);
    }
}
function buildLamp(pGeo, pMat, lGeo, lMat, x, h, z, dirX) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(pGeo, pMat); pole.position.y = h / 2 - 2; group.add(pole);
    const head = new THREE.Mesh(lGeo, lMat); head.position.set(dirX * 0.5, h - 2, 0); group.add(head);
    const light = new THREE.SpotLight(0xffaa00, 120, 80, Math.PI / 4, 0.8, 2);
    light.position.set(dirX * 0.5, h - 2.2, 0); light.target.position.set(dirX * 4, -2, z);
    group.add(light); group.add(light.target);
    group.position.set(x, 0, z); scene.add(group);
}
createStreetlights();


// ==========================================
// 👑 マスターデータ (CSVから完全反映！)
// ==========================================
// 空欄だった x_sat (満足度) と y_density (重要度/深さ) は推測で割り当てています。
const masterLifeRecords = [
    { id: 1, x_sat: 100, y_density: 8, date: "2008/09/13", events: ["おぎゃー！生まれる"], comments: [], category: "自然" },
    { id: 2, x_sat: 95, y_density: 6, date: "2010/02/01", events: ["アンパンマンミュージアムにおでかけ！"], comments: [], category: "イベント" },
    { id: 3, x_sat: 15, y_density: 7, date: "2013", events: ["インフルエンザにて演劇の主役を辞退！"], comments: [], category: "イベント" },
    { id: 4, x_sat: 85, y_density: 4, date: "2013", events: ["妖怪ウォッチにハマる"], comments: [], category: "ゲーム" },
    { id: 5, x_sat: 90, y_density: 5, date: "2013", events: ["鉄砲大会で優勝"], comments: [], category: "イベント" },
    { id: 6, x_sat: 80, y_density: 3, date: "2014", events: ["幼稚園でかき氷屋さん"], comments: [], category: "イベント" },
    { id: 7, x_sat: 75, y_density: 4, date: "2014", events: ["ピアノを習い始める"], comments: [], category: "音楽" },
    { id: 8, x_sat: 95, y_density: 5, date: "2015", events: ["ルービックキューブで6面そろえる"], comments: [], category: "ゲーム" },
    { id: 9, x_sat: 90, y_density: 4, date: "2015", events: ["書写の宿題で表彰される"], comments: [], category: "勉強" },
    { id: 10, x_sat: 20, y_density: 6, date: "2015", events: ["漢字テストでカンニングされる"], comments: [], category: "勉強" },
    { id: 11, x_sat: 85, y_density: 3, date: "2015", events: ["じゃんけん大会で優勝する"], comments: [], category: "イベント" },
    { id: 12, x_sat: 75, y_density: 3, date: "2015", events: ["けん玉にハマる"], comments: [], category: "ゲーム" },
    { id: 13, x_sat: 85, y_density: 5, date: "2016", events: ["車のCD(サカナクション、サザン、Boowyなど)に沼る"], comments: [], category: "音楽" },
    { id: 14, x_sat: 80, y_density: 4, date: "2016", events: ["コナンごっこ"], comments: [], category: "恋愛" },
    { id: 15, x_sat: 100, y_density: 6, date: "2016", events: ["自分の3DSをゲット！"], comments: [], category: "ゲーム" },
    { id: 16, x_sat: 65, y_density: 3, date: "2016", events: ["電波人間に課金"], comments: [], category: "ゲーム" },
    { id: 17, x_sat: 60, y_density: 4, date: "2016", events: ["水泳を習い始める"], comments: [], category: "習慣" },
    { id: 18, x_sat: 85, y_density: 5, date: "2016", events: ["図工の授業中に告白して3番目に..."], comments: [], category: "恋愛" },
    { id: 19, x_sat: 15, y_density: 6, date: "2017", events: ["牛乳いたずらで先生ぶち切れ"], comments: [], category: "事件" },
    { id: 20, x_sat: 100, y_density: 7, date: "2017", events: ["両想いの自由帳"], comments: [], category: "恋愛" },
    { id: 21, x_sat: 10, y_density: 6, date: "2017", events: ["友達のリコーダーを川にぶん投げかける"], comments: [], category: "事件" },
    { id: 22, x_sat: 80, y_density: 5, date: "2017", events: ["漫画を描き始める"], comments: [], category: "趣味" },
    { id: 23, x_sat: 50, y_density: 4, date: "2018", events: ["あだ名「えみこ」"], comments: [], category: "イベント" },
    { id: 24, x_sat: 90, y_density: 8, date: "2018", events: ["今でも恩人の先生"], comments: [], category: "イベント" },
    { id: 25, x_sat: 60, y_density: 5, date: "2018", events: ["校外学習でみんなを弄ぶクズ"], comments: [], category: "恋愛" },
    { id: 26, x_sat: 95, y_density: 8, date: "2018", events: ["脳内作曲の開始"], comments: [], category: "音楽" },
    { id: 27, x_sat: 5, y_density: 8, date: "2019", events: ["パワハラ担任が君臨"], comments: [], category: "事件" },
    { id: 28, x_sat: 0, y_density: 9, date: "2019", events: ["いじめ事件"], comments: [], category: "事件" },
    { id: 29, x_sat: 100, y_density: 6, date: "2019", events: ["Switch買う"], comments: [], category: "ゲーム" },
    { id: 30, x_sat: 40, y_density: 4, date: "2019", events: ["おとめちゃん呼ばわり"], comments: [], category: "イベント" },
    { id: 31, x_sat: 100, y_density: 8, date: "2019", events: ["運命のフォークダンス"], comments: [], category: "恋愛" },
    { id: 32, x_sat: 85, y_density: 5, date: "2020", events: ["神の日記"], comments: [], category: "趣味" },
    { id: 33, x_sat: 90, y_density: 7, date: "2020", events: ["学校を休んだ日の手紙"], comments: [], category: "恋愛" },
    { id: 34, x_sat: 75, y_density: 4, date: "2020", events: ["ぞうたときりんこの話「落とし穴」"], comments: [], category: "イベント" },
    { id: 35, x_sat: 95, y_density: 7, date: "2020", events: ["2人きりのフォートナイト"], comments: [], category: "恋愛" },
    { id: 36, x_sat: 95, y_density: 6, date: "2020", events: ["NCSに沼る"], comments: [], category: "音楽" },
    { id: 37, x_sat: 10, y_density: 8, date: "2021", events: ["フォートナイト告白爆死"], comments: [], category: "恋愛" },
    { id: 38, x_sat: 40, y_density: 5, date: "2021", events: ["ピアノをやめる"], comments: [], category: "音楽" },
    { id: 39, x_sat: 95, y_density: 8, date: "2021", events: ["Maestroで作曲開始"], comments: [], category: "音楽" },
    { id: 40, x_sat: 30, y_density: 6, date: "2021", events: ["イヤイヤ期でロン毛突入"], comments: [], category: "イベント" }
];

// ★ 詳細な日付(2008/09/13など)を解析し、現実の時間間隔でZ軸を算出するロジック ★
function getCalculatedZ(data, index) {
    if (timelineScaleSelect.value === 'custom') {
        // 出来事ごと＝1マスの場合は、シンプルにインデックス順に等間隔(12ユニット)で並べる
        return -index * 12.0;
    }

    // 日付文字列をパース可能な形式 (YYYY-MM-DD) に変換
    let dateStr = data.date.replace(/\//g, '-');
    // 年(YYYY)しか書かれていない場合は、その年の1月1日として扱う
    if (dateStr.length === 4) {
        dateStr += "-01-01";
    }

    const timestamp = Date.parse(dateStr);

    // もし日付の読み取りに失敗した場合は、フォールバックで等間隔に配置する
    if (isNaN(timestamp)) {
        return -index * 12.0;
    }

    // 空間の原点(Z=0)となる基準日を設定 (例: 2008年1月1日)
    const baseTimestamp = Date.parse('2008-01-01');
    const msPerDay = 1000 * 60 * 60 * 24;
    // 基準日からの経過日数を算出
    const daysFromBase = (timestamp - baseTimestamp) / msPerDay;

    // スケールに応じた距離の計算
    if (timelineScaleSelect.value === 'day') {
        // 1日 = 0.5ユニットの距離（約1年で182ユニット奥へ進む）
        return -daysFromBase * 0.5;
    } else if (timelineScaleSelect.value === 'month') {
        // 1ヶ月(約30.4日) = 10ユニットの距離
        return -(daysFromBase / 30.4) * 10.0;
    }

    return -index * 12.0; // フォールバック
}

function getColorBySatisfaction(sat) {
    if (sat >= 75) return 0xf472b6; // ピンク (幸福)
    if (sat >= 40) return 0x38bdf8; // ブルー (普通)
    return 0x94a3b8; // グレー (悲しみ/試練)
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
        const yPos = data.y_density * 1.5; // 少し高さを抑えめにして画面に収まりやすく
        let displayColor = getColorBySatisfaction(data.x_sat);

        // ノード本体 (自ら発光)
        const nodeMat = new THREE.MeshStandardMaterial({
            color: displayColor, emissive: displayColor, emissiveIntensity: 1.5, wireframe: true
        });
        const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMat);
        const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        nodeMesh.add(coreMesh); nodeMesh.position.set(xPos, yPos, tZ); group.add(nodeMesh);

        // クリスタル自体にポイントライトを追加
        const pointLight = new THREE.PointLight(displayColor, 30, 20);
        pointLight.position.set(xPos, yPos, tZ);
        group.add(pointLight);

        points.push(new THREE.Vector3(xPos, yPos, tZ));

        // 地面から伸びる光の柱
        const pillarGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xPos, -1.8, tZ), new THREE.Vector3(xPos, yPos, tZ)]);
        const pillarMat = new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.4 });
        group.add(new THREE.Line(pillarGeo, pillarMat));

        // 浮かぶテキストラベル
        const label = document.createElement('div');
        label.className = 'floating-label';
        const hexColor = '#' + displayColor.toString(16).padStart(6, '0');
        label.style.borderLeftColor = hexColor;

        // カテゴリーバッジを追加して視認性アップ
        const categoryHtml = data.category ? `<span style="font-size:9px; background:rgba(255,255,255,0.2); padding:2px 4px; border-radius:3px; margin-right:5px;">${data.category}</span>` : '';

        label.innerHTML = `<strong style="color:${hexColor}; font-family:'Share Tech Mono';">${data.date}</strong><br>${categoryHtml}${data.events[0]}`;
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

    timelineSlider.min = minZ - 20; timelineSlider.max = 20; timelineSlider.value = controls.target.z;
}

// ==========================================
// UI機能全般
// ==========================================
rankingPeriodSelect.addEventListener('change', refreshHappinessRanking);
function refreshHappinessRanking() {
    const period = rankingPeriodSelect.value;
    const filteredRecords = masterLifeRecords.filter(rec => {
        if (period === 'all') return true;
        return rec.date.startsWith(period); // 年での前方一致検索に対応
    });
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
    masterLifeRecords.push({ id: Date.now(), x_sat: sat, y_density: 4, date: date, events: [eventText], comments: [], category: "新規" });

    // 日付順に並び替え
    masterLifeRecords.sort((a, b) => {
        let dateA = Date.parse(a.date.replace(/\//g, '-').length === 4 ? a.date + "-01-01" : a.date.replace(/\//g, '-'));
        let dateB = Date.parse(b.date.replace(/\//g, '-').length === 4 ? b.date + "-01-01" : b.date.replace(/\//g, '-'));
        if (isNaN(dateA)) dateA = 0; if (isNaN(dateB)) dateB = 0;
        return dateA - dateB;
    });

    updateDynamicViewportChunks(); refreshHappinessRanking();

    const addedIndex = masterLifeRecords.findIndex(r => r.date === date && r.events[0] === eventText);
    warpToZCoordinate(getCalculatedZ(masterLifeRecords[addedIndex], addedIndex));
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

        const categoryHtml = data.category ? `<span style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; margin-left:8px;">${data.category}</span>` : '';

        noteTitle.innerHTML = `<span style="color:${hexColor}; font-weight:bold; font-family:'Share Tech Mono';">DATE: ${data.date}</span> ${categoryHtml} <span style="font-size:10px; color:var(--text-sub); float:right;">SAT: ${data.x_sat}%</span>`;
        noteEvents.innerHTML = `<div style="font-size:13px; margin-bottom:10px; color:#fff;">${data.events[0]}</div>`;
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
            camera.position.y += (6 - camera.position.y) * 0.05;
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
            // 近すぎず遠すぎない距離でラベルを表示 (範囲を広げました)
            if (dist > 10 && dist < 120) {
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