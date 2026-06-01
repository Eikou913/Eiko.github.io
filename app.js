// --- 1. 基本セットアップ ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
scene.fog = new THREE.FogExp2(0x050608, 0.012);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(12, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0);

controls.maxDistance = 1000;
controls.minDistance = 1;

// ライト設定
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(15, 25, 15);
scene.add(dirLight);

// --- 2. データの脳みそ（マスターデータバンク） ---
const masterLifeRecords = [
    { id: 1, x_sat: 20, y_density: 1, date: "2024.04.12", events: ["プログラミングのエラーが解けず一日が終わる。密度は薄い。"] },
    { id: 2, x_sat: 85, y_density: 2, date: "2025.08.19", events: ["京都の一人旅。予定していなかった隠れ家的なカフェを発見。"] },
    { id: 3, x_sat: 95, y_density: 3, date: "2026.06.02", events: ["新しい3Dライフログアプリの神UIロジックをひらめく！脳汁限界突破。"] },
    { id: 4, x_sat: 55, y_density: 1, date: "2030.12.25", events: ["【遥か未来】未来のクリスマス。自作アプリが世界中で稼働中。"] }
];

// 日付文字列から無限のZ座標を弾き出す高精度計算機
function mapDateToZ(dateStr) {
    const parts = dateStr.split('.');
    const year = parseInt(parts[0]);
    const month = parts[1] ? parseInt(parts[1]) : 1;
    const day = parts[2] ? parseInt(parts[2]) : 1;
    
    if (isNaN(year)) return camera.position.z - 10; // 文字ラベルは目の前に
    
    const baseDate = new Date(2024, 0, 1);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = (targetDate - baseDate) / (1000 * 60 * 60 * 24);
    
    return 30 - (diffDays / 365) * 20; // 1年で20ユニット進む
}

function mapSatisfactionToX(sat) { return ((sat / 100) * 16) - 8; }
// 満足度に応じたカラーコード
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0x2ed573;
    if (sat >= 40) return 0xffa500;
    return 0xff4757;
}

// --- 3. クッキリテキスト（1024px超高解像度テクスチャ）生成システム ---
const textureCache = new Map();
function createDateLabel(text, customColorHex = 0x00d2ff) {
    const cacheKey = `${text}_${customColorHex}`;
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey).clone();

    const canvas = document.createElement('canvas');
    canvas.width = 1024; 
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = 'Bold 84px "Helvetica Neue", Arial, sans-serif';
    // カラーコードをCSSの文字列に変換
    const colorStr = `#${customColorHex.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = colorStr;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = colorStr;
    ctx.shadowBlur = 20;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.5, 0.875, 1);
    
    textureCache.set(cacheKey, sprite);
    return sprite;
}

// --- 4. マインクラフト式・データ連動チャンク管理システム ---
const activeObjectsMap = new Map(); 
const clickableObjects = [];        

const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
// 点の真下のZ軸上に配置する「専用目盛り（光るネオンリング）」の形状定義
const spotTickGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24).rotateX(Math.PI / 2);

const baseBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });

function updateDynamicViewportChunks() {
    const camZ = camera.position.z;
    const visibleRange = 150; // 描画距離
    
    const minZ = camZ - visibleRange;
    const maxZ = camZ + visibleRange;

    const currentKeys = new Set();

    // ── ① 無限の数直線本体（カメラ追従） ──
    let infiniteLine = activeObjectsMap.get("infinite_line");
    if (!infiniteLine) {
        const lineGeom = new THREE.CylinderGeometry(0.04, 0.04, 600, 32).rotateX(Math.PI / 2);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5 }); // 線自体はシックな金属製に
        infiniteLine = new THREE.Mesh(lineGeom, lineMat);
        scene.add(infiniteLine);
        activeObjectsMap.set("infinite_line", infiniteLine);
    }
    infiniteLine.position.z = camZ;
    currentKeys.add("infinite_line");

    // ── ② 【重要】無差別目盛りを廃止し、データがある位置のみに目盛りと日付を動的錬成 ──
    masterLifeRecords.forEach(data => {
        const tZ = mapDateToZ(data.date);
        
        // カメラの視界内に入っている時だけ3D化
        if (tZ >= minZ && tZ <= maxZ) {
            const nodeKey = `node_${data.id}`;
            currentKeys.add(nodeKey);
            
            if (!activeObjectsMap.has(nodeKey)) {
                const group = new THREE.Group(); // 1つのデータに関連するオブジェクトをまとめるグループ
                
                const xPos = mapSatisfactionToX(data.x_sat);
                const mode = document.getElementById('color-mode').value;
                const pickerColor = document.getElementById('input-picker-color').value;
                
                let origColor = getColorBySatisfaction(data.x_sat);
                if (mode === 'manual') origColor = parseInt(pickerColor.replace('#', '0x'));
                let displayColor = mode === 'white' ? 0xffffff : origColor;

                // 1. 球体（満足度・密度プロット）
                const mat = new THREE.MeshStandardMaterial({ color: displayColor, emissive: displayColor, emissiveIntensity: 0.4, roughness: 0.1 });
                const sphere = new THREE.Mesh(sphereGeometry, mat);
                sphere.position.set(xPos, data.y_density * 1.5, tZ); // Y軸（密度）の高さに浮かせます
                group.add(sphere);

                // 2. Y軸の光の柱
                const beamHeight = data.y_density * 1.5; 
                const beamGeom = new THREE.CylinderGeometry(0.02, 0.02, beamHeight, 16).translate(0, beamHeight / 2, 0);
                const yBeam = new THREE.Mesh(beamGeom, baseBeamMat.clone());
                yBeam.position.set(xPos, 0, tZ);
                yBeam.scale.y = 0.001; 
                group.add(yBeam);

                // 3. レーザー補助線（Z軸上の目盛りから球体の真下までを水平に結ぶ）
                const linePoints = [new THREE.Vector3(0, 0, tZ), new THREE.Vector3(xPos, 0, tZ)];
                const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
                const lineMat = new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.4 });
                const guideLine = new THREE.Line(lineGeom, lineMat);
                group.add(guideLine);

                // 4. 📌【ご要望】Z軸上のジャスト位置に配置する「専用目盛り（リング）」
                const tickMat = new THREE.MeshBasicMaterial({ color: displayColor });
                const spotTick = new THREE.Mesh(spotTickGeom, tickMat);
                spotTick.position.set(0, 0, tZ);
                group.add(spotTick);

                // 5. 📌【ご要望】目盛りの真上（Y: 0.8）に浮かび上がる「超クッキリ日付テキスト」
                const dateLabel = createDateLabel(data.date, displayColor);
                dateLabel.position.set(0, 0.8, tZ);
                group.add(dateLabel);

                // タップ判定のために球体側にデータを紐づけて保管
                sphere.userData = { id: data.id, x_sat: data.x_sat, y_density: data.y_density, date: data.date, events: data.events, myColor: origColor, beam: yBeam, line: guideLine };
                clickableObjects.push(sphere);

                scene.add(group);
                activeObjectsMap.set(nodeKey, group);
            }
        }
    });

    // ── 🗑️ ③ 画面外に去った過去のデータを完全破壊（メモリ解放） ──
    for (let [key, obj] of activeObjectsMap.entries()) {
        if (!currentKeys.has(key)) {
            scene.remove(obj);
            activeObjectsMap.delete(key);
            
            // タップ判定アレイからもグループ内の球体を確実に消去
            if (key.startsWith("node_")) {
                const sphereMesh = obj.children[0];
                const clickIdx = clickableObjects.indexOf(sphereMesh);
                if (clickIdx > -1) clickableObjects.splice(clickIdx, 1);
            }
        }
    }
}

// --- 5. 次元ワープ（カメラの滑らかな高速移動）システム ---
let isWarping = false;
let targetCameraZ = 0;
let targetControlsTargetZ = 0;

function warpToZCoordinate(zPos) {
    targetCameraZ = zPos + 25;        // カメラ引き位置
    targetControlsTargetZ = zPos;     // 注視対象位置
    isWarping = true;
    closeNote();
}

// --- 6. 【新機能】タイムラインシークバー ＆ /tpコマンド連動システム ---
const timelineSlider = document.getElementById('timeline-slider');
const camZValText = document.getElementById('cam-z-val');
const tpInput = document.getElementById('tp-command-input');
const tpStatusMsg = document.getElementById('tp-status-msg');

// A. 画面下のバーをスライドした時、カメラのZ軸をマニアックにダイレクト移動
timelineSlider.addEventListener('input', () => {
    if (isWarping) isWarping = false; // 手動操作を最優先
    const val = parseFloat(timelineSlider.value);
    
    camera.position.z = val + 25;
    controls.target.z = val;
    camZValText.textContent = val.toFixed(1);
});

// B. 📟 マインクラフト完全準拠のテレポートコマンド判定エンジン
tpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = tpInput.value.trim();
        if (!cmd) return;

        // コマンド解析の正規表現（/tp [引数]）
        const tpRegex = /^\/tp\s+(.+)$/;
        const match = cmd.match(tpRegex);

        if (match) {
            const argument = match[1];
            
            // 数値（直接Z座標指定）か、日付（YYYY.MM.DD形式）かを自動判定
            if (!isNaN(argument)) {
                // 例: /tp -150
                const targetZ = parseFloat(argument);
                tpStatusMsg.style.color = "#2ed573";
                tpStatusMsg.textContent = `[System] ${argument} の座標座標へテレポートします`;
                warpToZCoordinate(targetZ);
            } else {
                // 例: /tp 2025.08.19
                const targetZ = mapDateToZ(argument);
                tpStatusMsg.style.color = "#2ed573";
                tpStatusMsg.textContent = `[System] 日付 ${argument} の座標（Z: ${targetZ.toFixed(1)}）へテレポートします`;
                warpToZCoordinate(targetZ);
            }
        } else {
            tpStatusMsg.style.color = "#ff4757";
            tpStatusMsg.textContent = `Unknown command. 使用例: /tp 2026.06.02 または /tp -50`;
        }
        tpInput.value = ""; // 入力欄をクリア
    }
});


// --- 7. コントロールパネルの既存イベント ---
const colorModeSelect = document.getElementById('color-mode');
const pickerGroup = document.getElementById('picker-group');
const addBtn = document.getElementById('add-btn');

addBtn.addEventListener('click', () => {
    const date = document.getElementById('input-date').value;
    const sat = parseInt(document.getElementById('input-sat').value);
    const density = parseInt(document.getElementById('input-density').value);
    const eventText = document.getElementById('input-event').value || "（イベント記載なし）";
    if(!date) { alert("日付を入力してください！"); return; }

    const newRecord = { id: Date.now(), x_sat: sat, y_density: density, date: date, events: [eventText] };
    masterLifeRecords.push(newRecord);
    
    // プロットした瞬間、その日付のZ座標へ自動ワープ
    warpToZCoordinate(mapDateToZ(date));
    document.getElementById('input-event').value = "";
});

colorModeSelect.addEventListener('change', () => {
    pickerGroup.style.display = colorModeSelect.value === 'manual' ? 'block' : 'none';
    // 宇宙を一度まっさらにして再描画
    for(let [key, obj] of activeObjectsMap.entries()) {
        if(key.startsWith("node_")) { scene.remove(obj); activeObjectsMap.delete(key); }
    }
    clickableObjects.length = 0;
    updateDynamicViewportChunks();
});

// --- 8. タップイベントと付箋UIの制御 ---
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
            obj.userData.beam.scale.y = 0.001;
            obj.userData.beam.material.opacity = 0;
            obj.userData.beam.userData.isExpanding = false;
        }
    });
}

function updateNotePosition() {
    if (!activeSphere || stickyNote.style.display === 'none') return;
    const data = activeSphere.userData;
    const targetPosition = new THREE.Vector3();
    activeSphere.getWorldPosition(targetPosition);
    targetPosition.y += 0.5; 
    targetPosition.project(camera);
    stickyNote.style.left = `${(targetPosition.x * .5 + .5) * window.innerWidth}px`;
    stickyNote.style.top = `${(targetPosition.y * -.5 + .5) * window.innerHeight}px`;
}

function closeNote() {
    stickyNote.classList.remove('active');
    setTimeout(() => { stickyNote.style.display = 'none'; }, 300);
    resetActiveEffects();
    activeSphere = null;
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 9. アニメーションループ ---
function animate() {
    requestAnimationFrame(animate);
    
    // 滑らかなワープ（カメラの自動移動）
    if (isWarping) {
        camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
        controls.target.z += (targetControlsTargetZ - controls.target.z) * 0.08;
        
        // シークバーの値もワープ中のカメラとリアルタイム同期
        timelineSlider.value = camera.position.z - 25;
        camZValText.textContent = (camera.position.z - 25).toFixed(1);

        if (Math.abs(camera.position.z - targetCameraZ) < 0.1) {
            camera.position.z = targetCameraZ;
            controls.target.z = targetControlsTargetZ;
            isWarping = false;
        }
    } else {
        // マウスの通常ドラッグ時も、カメラの現在地を常にシークバーに数値フィードバック
        timelineSlider.value = camera.position.z - 25;
        camZValText.textContent = (camera.position.z - 25).toFixed(1);
    }

    controls.update();
    updateDynamicViewportChunks(); // 常にチャンクの描画・更新

    // 球体の自転とビーム
    clickableObjects.forEach(obj => {
        obj.rotation.y += 0.01;
        if (obj.userData.beam && obj.userData.beam.userData.isExpanding && obj.userData.beam.scale.y < 1) {
            obj.userData.beam.scale.y += (1 - obj.userData.beam.scale.y) * 0.15;
        }
    });

    updateNotePosition();
    renderer.render(scene, camera);
}
animate();