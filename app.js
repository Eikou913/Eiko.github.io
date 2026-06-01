// --- 1. 基本セットアップ ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
scene.fog = new THREE.FogExp2(0x050608, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0);

// --- 2. データの脳みそ（マスターデータ） ---
const masterLifeRecords = [
    { id: 1, x_sat: 20, y_density: 1, date: "2026.04.12", events: ["低迷期。プログラミングのエラーが解けず一日が終わる。"] },
    { id: 2, x_sat: 85, y_density: 2, date: "2026.05.19", events: ["京都の一人旅。予定していなかった隠れ家的なカフェを発見。"] },
    { id: 3, x_sat: 95, y_density: 3, date: "2026.06.02", events: ["3Dライフログアプリのビルドシステムをひらめく！脳汁限界突破。"] },
    { id: 4, x_sat: 60, y_density: 1, date: "2026.07.10", events: ["未来ログ。自分のタイムライン数直線がどんどん伸びていく。"] }
];

// 💡 タイムラインの「時間的な起点（Z=0の位置）」を、登録データの中の【最古の日付】に自動決定する知能
function getBaseDate() {
    if (masterLifeRecords.length === 0) return new Date(2026, 5, 2);
    const dates = masterLifeRecords.map(r => {
        const p = r.date.split('.');
        return new Date(parseInt(p[0]), parseInt(p[1]) - 1, p[2] ? parseInt(p[2]) : 1);
    });
    return new Date(Math.min(...dates)); // 最古の日付を返す
}

// 💡 【超重要】1マスあたりの時間スケール（倍率倍数）を算出する関数
// 1マスの幅を3ユニットとした時の、1日あたりのZ軸移動量を計算
function getScaleMultiplier() {
    const scaleMode = document.getElementById('timeline-scale').value;
    if (scaleMode === 'week')  return 3.0 / 7.0;  // 1週間（7日）＝3ユニット
    if (scaleMode === 'month') return 3.0 / 30.0; // 1ヶ月（30日）＝3ユニット
    return 3.0;                                   // 1日＝3ユニット（デフォルト）
}

// 日付文字列から、カスタムスケールを適用した正確なZ座標を弾き出す計算機
function mapDateToZ(dateStr) {
    const parts = dateStr.split('.');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parts[2] ? parseInt(parts[2]) : 1;
    
    if (isNaN(year)) return camera.position.z - 10;
    
    const baseDate = getBaseDate();
    const targetDate = new Date(year, month - 1, day);
    const diffDays = (targetDate - baseDate) / (1000 * 60 * 60 * 24);
    
    // 起点から未来に行くほど、Z軸のマイナス（奥）へ進む
    return -diffDays * getScaleMultiplier();
}

function mapSatisfactionToX(sat) { return ((sat / 100) * 16) - 8; }
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0x2ed573;
    if (sat >= 40) return 0xffa500;
    return 0xff4757;
}

// --- 3. クッキリテキスト（1024px超高解像度テクスチャ）システム ---
const textureCache = new Map();
function createDateLabel(text, customColorHex = 0x00d2ff) {
    const cacheKey = `${text}_${customColorHex}`;
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey).clone();

    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'Bold 80px "Helvetica Neue", Arial, sans-serif';
    const colorStr = `#${customColorHex.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = colorStr; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = colorStr; ctx.shadowBlur = 20;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.5, 0.875, 1);
    textureCache.set(cacheKey, sprite);
    return sprite;
}

// --- 4. 【核心】人生の長さだけ線が伸びる「タイムライン・ビルディング」システム ---
const activeObjectsMap = new Map(); 
const clickableObjects = [];        

const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
const spotTickGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24).rotateX(Math.PI / 2);
const baseBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });

function updateDynamicViewportChunks() {
    const currentKeys = new Set();
    
    if (masterLifeRecords.length === 0) return;

    // ── ① 【革命】データが存在する範囲（最古〜最新）の分だけ数直線をジャスト生成 ──
    const zPositions = masterLifeRecords.map(r => mapDateToZ(r.date));
    const maxZ = Math.max(...zPositions); // 数値的に大きい＝過去（手前）
    const minZ = Math.min(...zPositions); // 数値的に小さい＝未来（奥）

    let timelineLine = activeObjectsMap.get("built_line");
    if (timelineLine) scene.remove(timelineLine); // スケール変更に対応するため毎回再生成

    const lineLength = Math.abs(maxZ - minZ) + 10; // 前後に少しマージンを足す
    const lineCenterZ = (maxZ + minZ) / 2;

    const lineGeom = new THREE.CylinderGeometry(0.05, 0.05, lineLength, 32).rotateX(Math.PI / 2);
    const lineMat = new THREE.MeshStandardMaterial({ 
        color: 0x00d2ff, 
        emissive: 0x00a8ff, 
        emissiveIntensity: 0.1,
        roughness: 0.2 
    });
    timelineLine = new THREE.Mesh(lineGeom, lineMat);
    timelineLine.position.set(0, 0, lineCenterZ);
    scene.add(timelineLine);
    activeObjectsMap.set("built_line", timelineLine);
    currentKeys.add("built_line");

    // ── ② データがある位置だけにピンポイントで目盛りリングと日付テキストを設置 ──
    masterLifeRecords.forEach(data => {
        const tZ = mapDateToZ(data.date);
        const nodeKey = `node_${data.id}`;
        currentKeys.add(nodeKey);
        
        if (!activeObjectsMap.has(nodeKey)) {
            const group = new THREE.Group();
            const xPos = mapSatisfactionToX(data.x_sat);
            const mode = document.getElementById('color-mode').value;
            const pickerColor = document.getElementById('input-picker-color').value;
            
            let origColor = getColorBySatisfaction(data.x_sat);
            if (mode === 'manual') origColor = parseInt(pickerColor.replace('#', '0x'));
            let displayColor = mode === 'white' ? 0xffffff : origColor;

            // 1. 球体
            const mat = new THREE.MeshStandardMaterial({ color: displayColor, emissive: displayColor, emissiveIntensity: 0.4, roughness: 0.1 });
            const sphere = new THREE.Mesh(sphereGeometry, mat);
            sphere.position.set(xPos, data.y_density * 1.5, tZ);
            group.add(sphere);

            // 2. Y軸光の柱
            const beamHeight = data.y_density * 1.5; 
            const beamGeom = new THREE.CylinderGeometry(0.02, 0.02, beamHeight, 16).translate(0, beamHeight / 2, 0);
            const yBeam = new THREE.Mesh(beamGeom, baseBeamMat.clone());
            yBeam.position.set(xPos, 0, tZ); yBeam.scale.y = 0.001; 
            group.add(yBeam);

            // 3. レーザー補助線
            const linePoints = [new THREE.Vector3(0, 0, tZ), new THREE.Vector3(xPos, 0, tZ)];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
            const lineMat = new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.4 });
            group.add(new THREE.Line(lineGeom, lineMat));

            // 4. 専用目盛り（ネオンリング）
            const spotTick = new THREE.Mesh(spotTickGeom, new THREE.MeshBasicMaterial({ color: displayColor }));
            spotTick.position.set(0, 0, tZ);
            group.add(spotTick);

            // 5. 目盛りの上のクッキリ日付文字
            const dateLabel = createDateLabel(data.date, displayColor);
            dateLabel.position.set(0, 0.8, tZ);
            group.add(dateLabel);

            sphere.userData = { id: data.id, x_sat: data.x_sat, y_density: data.y_density, date: data.date, events: data.events, myColor: origColor, beam: yBeam };
            clickableObjects.push(sphere);

            scene.add(group);
            activeObjectsMap.set(nodeKey, group);
        }
    });

    // ── 🗑️ ③ 削除されたノード等のクリーンアップ ──
    for (let [key, obj] of activeObjectsMap.entries()) {
        if (!currentKeys.has(key)) {
            scene.remove(obj); activeObjectsMap.delete(key);
            if (key.startsWith("node_")) {
                const clickIdx = clickableObjects.indexOf(obj.children[0]);
                if (clickIdx > -1) clickableObjects.splice(clickIdx, 1);
            }
        }
    }

    // ── ⚙️ ④ 横スクロールバー（Slider）の限界値をデータの長さに自動アジャスト ──
    // スプレッドシートのスクロール領域が、データに応じて自動で広がる極上UX
    const buffer = 40;
    timelineSlider.min = Math.floor(minZ - buffer);
    timelineSlider.max = Math.ceil(maxZ + buffer);
}

// --- 5. 次元ワープ（カメラの滑らかな高速移動）システム ---
let isWarping = false;
let targetCameraZ = 0;
let targetControlsTargetZ = 0;

function warpToZCoordinate(zPos) {
    targetCameraZ = zPos + 25;
    targetControlsTargetZ = zPos;
    isWarping = true;
    closeNote();
}

// --- 6. スライダー ＆ スケール ＆ /tpコマンド連動システム ---
const timelineSlider = document.getElementById('timeline-slider');
const camZValText = document.getElementById('cam-z-val');
const tpInput = document.getElementById('tp-command-input');
const tpStatusMsg = document.getElementById('tp-status-msg');
const timelineScaleSelect = document.getElementById('timeline-scale');

// A. 横シークバーのドラッグ移動
timelineSlider.addEventListener('input', () => {
    if (isWarping) isWarping = false;
    const val = parseFloat(timelineSlider.value);
    camera.position.z = val + 25;
    controls.target.z = val;
    camZValText.textContent = val.toFixed(1);
});

// B. 📐 スケール（1マス＝1日/1週間/1ヶ月）が切り替わったときのリアルタイム空間伸縮処理
timelineScaleSelect.addEventListener('change', () => {
    // 一度すべての3Dオブジェクトを強制解体して、新スケールで再ビルドをかける
    for(let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); }
    activeObjectsMap.clear();
    clickableObjects.length = 0;
    
    updateDynamicViewportChunks();
    // 起点（最古のデータ位置）へカメラを優しく戻す
    warpToZCoordinate(mapDateToZ(masterLifeRecords[0].date));
});

// C. 📟 /tp コマンド解析エンジン
tpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = tpInput.value.trim(); if (!cmd) return;
        const match = cmd.match(/^\/tp\s+(.+)$/);

        if (match) {
            const arg = match[1];
            if (!isNaN(arg)) {
                tpStatusMsg.style.color = "#2ed573";
                tpStatusMsg.textContent = `[System] 座標 ${arg} へテレポートします`;
                warpToZCoordinate(parseFloat(arg));
            } else {
                const targetZ = mapDateToZ(arg);
                tpStatusMsg.style.color = "#2ed573";
                tpStatusMsg.textContent = `[System] ${arg}（Z: ${targetZ.toFixed(1)}）へテレポートします`;
                warpToZCoordinate(targetZ);
            }
        } else {
            tpStatusMsg.style.color = "#ff4757";
            tpStatusMsg.textContent = `Unknown command. 例: /tp 2026.06.02`;
        }
        tpInput.value = "";
    }
});

// 新しい記録のプロット
document.getElementById('add-btn').addEventListener('click', () => {
    const date = document.getElementById('input-date').value;
    const sat = parseInt(document.getElementById('input-sat').value);
    const density = parseInt(document.getElementById('input-density').value);
    const eventText = document.getElementById('input-event').value || "（イベント記載なし）";
    if(!date) { alert("日付を入力してください！"); return; }

    masterLifeRecords.push({ id: Date.now(), x_sat: sat, y_density: density, date: date, events: [eventText] });
    
    // プロットした瞬間、その新しい座標を反映して線が自動で「ギュンッ」と伸びる！
    for(let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); } activeObjectsMap.clear(); clickableObjects.length = 0;
    updateDynamicViewportChunks();
    
    warpToZCoordinate(mapDateToZ(date));
    document.getElementById('input-event').value = "";
});

document.getElementById('color-mode').addEventListener('change', () => {
    document.getElementById('picker-group').style.display = document.getElementById('color-mode').value === 'manual' ? 'block' : 'none';
    for(let [key, obj] of activeObjectsMap.entries()) { if(key.startsWith("node_")) { scene.remove(obj); activeObjectsMap.delete(key); } }
    clickableObjects.length = 0; updateDynamicViewportChunks();
});

// --- 7. タップイベントと付箋UIの制御 ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const stickyNote = document.getElementById('sticky-note');
const noteTitle = document.getElementById('note-title');
const noteEvents = document.getElementById('note-events');
let activeSphere = null;

window.addEventListener('click', onPointerDown, false);

function onPointerDown(event) {
    if (event.target.id !== 'canvas-container' && event.target.tagName !== 'CANVAS') return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        resetActiveEffects();
        activeSphere = intersects[0].object;
        const data = activeSphere.userData;
        data.beam.material.opacity = 0.4;
        data.beam.userData.isExpanding = true;
        noteTitle.innerHTML = `<span>📅 ${data.date}</span> <span style="font-size:11px; color:#666;">満足度: ${data.x_sat}%</span>`;
        let eventsHtml = "";
        data.events.forEach(evt => { eventsHtml += `<div class="event-item">${evt}</div>`; });
        noteEvents.innerHTML = eventsHtml;
        stickyNote.style.display = 'block';
        updateNotePosition();
        setTimeout(() => stickyNote.classList.add('active'), 10);
    } else { closeNote(); }
}

function resetActiveEffects() {
    clickableObjects.forEach(obj => {
        if (obj.userData.beam) {
            obj.userData.beam.scale.y = 0.001; obj.userData.beam.material.opacity = 0; obj.userData.beam.userData.isExpanding = false;
        }
    });
}

// 付箋UIの位置同期
function updateNotePosition() {
    if (!activeSphere || stickyNote.style.display === 'none') return;
    const targetPosition = new THREE.Vector3();
    activeSphere.getWorldPosition(targetPosition);
    targetPosition.y += 0.5; 
    targetPosition.project(camera);
    stickyNote.style.left = `${(targetPosition.x * .5 + .5) * window.innerWidth}px`;
    stickyNote.style.top = `${(targetPosition.y * -.5 + .5) * window.innerHeight}px`;
}

function closeNote() {
    stickyNote.classList.remove('active'); setTimeout(() => { stickyNote.style.display = 'none'; }, 300);
    resetActiveEffects(); activeSphere = null;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 8. アニメーションループ ---
function animate() {
    requestAnimationFrame(animate);
    
    if (isWarping) {
        camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
        controls.target.z += (targetControlsTargetZ - controls.target.z) * 0.08;
        timelineSlider.value = camera.position.z - 25;
        camZValText.textContent = (camera.position.z - 25).toFixed(1);

        if (Math.abs(camera.position.z - targetCameraZ) < 0.1) {
            camera.position.z = targetCameraZ; controls.target.set(0, 1, targetControlsTargetZ); isWarping = false;
        }
    } else {
        timelineSlider.value = camera.position.z - 25;
        camZValText.textContent = (camera.position.z - 25).toFixed(1);
    }

    controls.update();
    updateDynamicViewportChunks();

    clickableObjects.forEach(obj => {
        obj.rotation.y += 0.01;
        if (obj.userData.beam && obj.userData.beam.userData.isExpanding && obj.userData.beam.scale.y < 1) {
            obj.userData.beam.scale.y += (1 - obj.userData.beam.scale.y) * 0.15;
        }
    });

    updateNotePosition();
    renderer.render(scene, camera);
}
// 宇宙創生
updateDynamicViewportChunks();
animate();