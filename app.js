// --- 📖 ノートを開くオープニング演出ロジック ---
const notebookOverlay = document.getElementById('notebook-overlay');
notebookOverlay.addEventListener('click', () => {
    notebookOverlay.classList.add('opened'); 
});

// --- 📱 スマホメニュー開閉制御 ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const controlPanel = document.getElementById('control-panel');
const panelCloseBtn = document.getElementById('panel-close-btn');

menuToggleBtn.addEventListener('click', () => { controlPanel.classList.add('open'); });
panelCloseBtn.addEventListener('click', closeMenuPanel);
function closeMenuPanel() { controlPanel.classList.remove('open'); }

// --- 1. 基本セットアップ ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff0f3);
scene.fog = new THREE.FogExp2(0xfff0f3, 0.015);

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

controls.maxDistance = 1000; controls.minDistance = 1;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffeef2, 0.8);
dirLight.position.set(15, 25, 15);
scene.add(dirLight);

// --- 2. 👑 あなたの本当の年表データを完全注入！ ---
// 💡 満足度(x_sat)や密度(y_density)を、出来事のエピソードに合わせて完璧に可愛く補完しました！
const masterLifeRecords = [
    { id: 1, x_sat: 100, y_density: 3, date: "2008", events: ["おぎゃー！栄光王国に生まれる👶✨記念すべき人生のスタートライン！"] },
    { id: 2, x_sat: 95, y_density: 2, date: "2009", events: ["アンパンマンミュージアムにおでかけ🎡アンパンマンたちに会えてとってもはっぴーだったなぁ！"] },
    { id: 3, x_sat: 15, y_density: 3, date: "2011", events: ["インフルエンザにかかっちゃって、ずっと練習していた演劇の主役を涙の辞退...。かなしいウルウルブルーの日。"] },
    { id: 4, x_sat: 85, y_density: 2, date: "2012", events: ["妖怪ウォッチに大ブーム到来！ジバニャンたちと一緒に毎日ウォッチッチ⌚✨"] },
    { id: 5, x_sat: 90, y_density: 2, date: "2013", events: ["ルービックキューブに熱中！ついにカチカチと「6面すべて」をそろえることに大成功したよ！ピコピコ🧠"] },
    { id: 6, x_sat: 80, y_density: 1, date: "2013", events: ["かけひき無用のけんだまブーム！もしもしかめよ〜って毎日お部屋でいっぱい練習したおもいで🔴"] }
];

function getBaseDate() {
    // 日付計算用の基準日（最古のデータ）
    return new Date(2008, 0, 1);
}

function getScaleMultiplier() {
    const scaleMode = document.getElementById('timeline-scale').value;
    if (scaleMode === 'week')  return 3.0 / 7.0;  
    if (scaleMode === 'month') return 3.0 / 30.0; 
    return 3.0; // 1日=3ユニット
}

// 💡 従来の「日付ベース」のZ軸計算関数（通常モード用）
function mapDateToZ(dateStr) {
    const parts = dateStr.split('.');
    const year = parseInt(parts[0]);
    const month = parts[1] ? parseInt(parts[1]) : 1;
    const day = parts[2] ? parseInt(parts[2]) : 1;
    if (isNaN(year)) return camera.position.z - 10;
    
    const baseDate = getBaseDate();
    const targetDate = new Date(year, month - 1, day);
    return -(targetDate - baseDate) / (1000 * 60 * 60 * 24) * getScaleMultiplier();
}

// 💡 【新設の神ロジック】スケール設定に基づいて、正確な3D上のZ座標を弾き分ける指揮官関数
function getCalculatedZ(data, index) {
    const scaleMode = document.getElementById('timeline-scale').value;
    
    // 王様の理想：「出来事1つで1マス（カスタム）」の時
    if (scaleMode === 'custom') {
        // 日付のブランクに関係なく、配列のインデックス順に等間隔（4.5ユニットおき）でプロットする
        return -index * 4.5;
    }
    
    // 通常の1日/1週間/1ヶ月モードの時
    return mapDateToZ(data.date);
}

function mapSatisfactionToX(sat) { return ((sat / 100) * 16) - 8; }
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0xff758f; // ストロベリーピンク
    if (sat >= 40) return 0xffca3a; // マイルドイエロー
    return 0x90e0ef;               // ラムネソーダブルー
}

// --- 3. クッキリテキストシステム ---
const textureCache = new Map();
function createDateLabel(text, customColorHex = 0xff758f) {
    const cacheKey = `${text}_${customColorHex}`;
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey).clone();
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'Bold 84px "Quicksand", Arial, sans-serif';
    const colorStr = `#${customColorHex.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = colorStr; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 117, 143, 0.3)'; ctx.shadowBlur = 15;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas); texture.minFilter = THREE.LinearMipmapLinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat); sprite.scale.set(3.5, 0.875, 1);
    textureCache.set(cacheKey, sprite); return sprite;
}

// --- 4. ぷっくり可愛い「3D星型（☆）」の幾何学錬成エンジン ---
function createStarGeometry() {
    const shape = new THREE.Shape();
    const spikes = 5; const outerRadius = 0.55; const innerRadius = 0.23;
    let rot = Math.PI / 2 * 3; let x = 0; let y = 0; const step = Math.PI / spikes;
    shape.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius; y = Math.sin(rot) * outerRadius; shape.lineTo(x, y); rot += step;
        x = Math.cos(rot) * innerRadius; y = Math.sin(rot) * innerRadius; shape.lineTo(x, y); rot += step;
    }
    shape.lineTo(0, -outerRadius);
    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings); geom.center();
    return geom;
}
const starGeometry = createStarGeometry();

// --- 5. タイムライン・ビルディングシステム ---
const activeObjectsMap = new Map(); 
const clickableObjects = [];        
const spotTickGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24).rotateX(Math.PI / 2);
const baseBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });

function updateDynamicViewportChunks() {
    const currentKeys = new Set();
    if (masterLifeRecords.length === 0) return;

    // ── ① データが存在する範囲の分だけ数直線を自動ビルド ──
    const zPositions = masterLifeRecords.map((r, i) => getCalculatedZ(r, i));
    const maxZ = Math.max(...zPositions); const minZ = Math.min(...zPositions); 

    let timelineLine = activeObjectsMap.get("built_line");
    if (timelineLine) scene.remove(timelineLine); 

    const lineLength = Math.abs(maxZ - minZ) + 10; const lineCenterZ = (maxZ + minZ) / 2;
    const lineGeom = new THREE.CylinderGeometry(0.04, 0.04, lineLength, 32).rotateX(Math.PI / 2);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffd6ba, emissive: 0xffb3c6, emissiveIntensity: 0.2, roughness: 0.3 });
    timelineLine = new THREE.Mesh(lineGeom, lineMat); timelineLine.position.set(0, 0, lineCenterZ);
    scene.add(timelineLine); activeObjectsMap.set("built_line", timelineLine); currentKeys.add("built_line");

    // ── ② お星さまノードの動的レンダリングループ ──
    masterLifeRecords.forEach((data, index) => {
        const tZ = getCalculatedZ(data, index); // 💡 新しい計算機からZ座標をゲット
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

            // 1. 立体の☆マーク
            const mat = new THREE.MeshStandardMaterial({ color: displayColor, emissive: displayColor, emissiveIntensity: 0.3, roughness: 0.2 });
            const starMesh = new THREE.Mesh(starGeometry, mat);
            starMesh.position.set(xPos, data.y_density * 1.5, tZ);
            group.add(starMesh);

            // 2. Y軸ビーム
            const beamHeight = data.y_density * 1.5; 
            const beamGeom = new THREE.CylinderGeometry(0.02, 0.02, beamHeight, 16).translate(0, beamHeight / 2, 0);
            const yBeam = new THREE.Mesh(beamGeom, baseBeamMat.clone());
            yBeam.position.set(xPos, 0, tZ); yBeam.scale.y = 0.001; group.add(yBeam);

            // 3. レーザー補助線
            const linePoints = [new THREE.Vector3(0, 0, tZ), new THREE.Vector3(xPos, 0, tZ)];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
            group.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.5 })));

            // 4. リング目盛り
            const spotTick = new THREE.Mesh(spotTickGeom, new THREE.MeshBasicMaterial({ color: displayColor }));
            spotTick.position.set(0, 0, tZ); group.add(spotTick);

            // 5. お星さまの下のクッキリ年号テキスト
            const dateLabel = createDateLabel(data.date, displayColor);
            dateLabel.position.set(0, 0.8, tZ); group.add(dateLabel);

            // データをバインド
            starMesh.userData = { id: data.id, x_sat: data.x_sat, y_density: data.y_density, date: data.date, index: index, events: data.events, myColor: origColor, beam: yBeam };
            clickableObjects.push(starMesh);

            scene.add(group); activeObjectsMap.set(nodeKey, group);
        }
    });

    for (let [key, obj] of activeObjectsMap.entries()) {
        if (!currentKeys.has(key)) {
            scene.remove(obj); activeObjectsMap.delete(key);
            if (key.startsWith("node_")) {
                const clickIdx = clickableObjects.indexOf(obj.children[0]);
                if (clickIdx > -1) clickableObjects.splice(clickIdx, 1);
            }
        }
    }

    const buffer = 30;
    timelineSlider.min = Math.floor(minZ - buffer); timelineSlider.max = Math.ceil(maxZ + buffer);
}

// --- 6. YouTubeアナリティクス風・満足度ランキング機能 ---
const rankingPeriodSelect = document.getElementById('ranking-period');
const rankingListContainer = document.getElementById('ranking-list-container');

rankingPeriodSelect.addEventListener('change', refreshHappinessRanking);

function refreshHappinessRanking() {
    const period = rankingPeriodSelect.value; 
    
    const filteredRecords = masterLifeRecords.filter(rec => {
        if (period === 'all') return true;
        return rec.date.startsWith(period); 
    });

    filteredRecords.sort((a, b) => b.x_sat - a.x_sat);

    let html = "";
    if (filteredRecords.length === 0) {
        html = `<div style="font-size:11px; text-align:center; color:#a39296; padding:10px;">このおもいではまだありません🧸</div>`;
    } else {
        filteredRecords.forEach((rec, index) => {
            const rankNum = index + 1;
            let badgeClass = "rank-other";
            if (rankNum === 1) badgeClass = "rank-1";
            if (rankNum === 2) badgeClass = "rank-2";
            if (rankNum === 3) badgeClass = "rank-3";

            // 💡 内部の登録順インデックスを元にワープ座標を正確に計算する仕掛けに進化！
            html += `
                <div class="ranking-item" onclick="warpToRecordFromRanking(${rec.id})">
                    <div class="rank-badge ${badgeClass}">${rankNum}</div>
                    <div class="rank-date">${rec.date}年 のできごと</div>
                    <div class="rank-score">${rec.x_sat}%</div>
                </div>
            `;
        });
    }
    rankingListContainer.innerHTML = html;
}

// ランキングタップ時にその「要素」をピンポイントで捉えてワープする精密追従
window.warpToRecordFromRanking = function(id) {
    const recIdx = masterLifeRecords.findIndex(r => r.id === id);
    if(recIdx > -1) {
        const targetZ = getCalculatedZ(masterLifeRecords[recIdx], recIdx);
        warpToZCoordinate(targetZ);
        closeMenuPanel();
    }
};

// --- 7. 各種コンソール連動 ---
const timelineSlider = document.getElementById('timeline-slider');
const camZValText = document.getElementById('cam-z-val');
const tpInput = document.getElementById('tp-command-input');
const tpStatusMsg = document.getElementById('tp-status-msg');
const timelineScaleSelect = document.getElementById('timeline-scale');

timelineSlider.addEventListener('input', () => {
    if (isWarping) isWarping = false;
    const val = parseFloat(timelineSlider.value);
    camera.position.z = val + 25; controls.target.z = val; camZValText.textContent = val.toFixed(1);
});

timelineScaleSelect.addEventListener('change', () => {
    for(let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); }
    activeObjectsMap.clear(); clickableObjects.length = 0;
    updateDynamicViewportChunks();
    // 最初の要素へスマートに戻る
    warpToZCoordinate(getCalculatedZ(masterLifeRecords[0], 0));
    closeMenuPanel(); 
});

tpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = tpInput.value.trim(); if (!cmd) return;
        const match = cmd.match(/^\/tp\s+(.+)$/);
        if (match) {
            const arg = match[1];
            // ユーザーが西暦を打ったとき
            const recIdx = masterLifeRecords.findIndex(r => r.date === arg);
            if (recIdx > -1) {
                const targetZ = getCalculatedZ(masterLifeRecords[recIdx], recIdx);
                tpStatusMsg.style.color = "#ff758f"; tpStatusMsg.textContent = `[System] tp to ${arg}年`;
                warpToZCoordinate(targetZ);
            } else if (!isNaN(arg)) {
                // 直接の数値座標のとき
                tpStatusMsg.style.color = "#ff758f"; tpStatusMsg.textContent = `[System] tp coordinate ${arg}`;
                warpToZCoordinate(parseFloat(arg));
            } else {
                tpStatusMsg.style.color = "#ff4757"; tpStatusMsg.textContent = `年表データが見つかりません。`;
            }
            setTimeout(closeMenuPanel, 800); 
        } else {
            tpStatusMsg.style.color = "#ff4757"; tpStatusMsg.textContent = `Unknown command.`;
        }
        tpInput.value = "";
    }
});

// 新しいおもいでのプロット追加
document.getElementById('add-btn').addEventListener('click', () => {
    const date = document.getElementById('input-date').value;
    const sat = parseInt(document.getElementById('input-sat').value);
    const density = parseInt(document.getElementById('input-density').value);
    const eventText = document.getElementById('input-event').value || "（イベント記載なし）";
    if(!date) { alert("年・日付を入力してください！"); return; }

    const newRec = { id: Date.now(), x_sat: sat, y_density: density, date: date, events: [eventText] };
    masterLifeRecords.push(newRec);
    
    for(let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); } activeObjectsMap.clear(); clickableObjects.length = 0;
    
    updateDynamicViewportChunks();
    refreshHappinessRanking();
    
    // 追加された最後の場所へカメラを自動追従ワープ！
    const newIdx = masterLifeRecords.length - 1;
    warpToZCoordinate(getCalculatedZ(newRec, newIdx));
    
    document.getElementById('input-event').value = "";
    closeMenuPanel(); 
});

document.getElementById('color-mode').addEventListener('change', () => {
    document.getElementById('picker-group').style.display = document.getElementById('color-mode').value === 'manual' ? 'block' : 'none';
    for(let [key, obj] of activeObjectsMap.entries()) { if(key.startsWith("node_")) { scene.remove(obj); activeObjectsMap.delete(key); } }
    clickableObjects.length = 0; updateDynamicViewportChunks();
});

// --- 8. タップイベントと付箋UIの制御 ---
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
const stickyNote = document.getElementById('sticky-note');
const noteTitle = document.getElementById('note-title'); const noteEvents = document.getElementById('note-events');
let activeSphere = null;

window.addEventListener('click', onPointerDown, false);

function onPointerDown(event) {
    if (event.target.id !== 'canvas-container' && event.target.tagName !== 'CANVAS') return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        resetActiveEffects();
        activeSphere = intersects[0].object;
        const data = activeSphere.userData;
        data.beam.material.opacity = 0.4; data.beam.userData.isExpanding = true;
        noteTitle.innerHTML = `<span>📅 ${data.date}年</span> <span style="font-size:10px; color:#8a7a7f;">満足度: ${data.x_sat}%</span>`;
        let eventsHtml = ""; data.events.forEach(evt => { eventsHtml += `<div class="event-item">${evt}</div>`; });
        noteEvents.innerHTML = eventsHtml; stickyNote.style.display = 'block';
        updateNotePosition(); setTimeout(() => stickyNote.classList.add('active'), 10);
    } else { closeNote(); }
}

function resetActiveEffects() {
    clickableObjects.forEach(obj => {
        if (obj.userData.beam) {
            obj.userData.beam.scale.y = 0.001; obj.userData.beam.material.opacity = 0; obj.userData.beam.userData.isExpanding = false;
        }
    });
}

function updateNotePosition() {
    if (!activeSphere || stickyNote.style.display === 'none') return;
    const targetPosition = new THREE.Vector3(); activeSphere.getWorldPosition(targetPosition);
    targetPosition.y += 0.5; targetPosition.project(camera);
    stickyNote.style.left = `${(targetPosition.x * .5 + .5) * window.innerWidth}px`;
    stickyNote.style.top = `${(targetPosition.y * -.5 + .5) * window.innerHeight}px`;
}

function closeNote() {
    stickyNote.classList.remove('active'); setTimeout(() => { stickyNote.style.display = 'none'; }, 300);
    resetActiveEffects(); activeSphere = null;
}

let isWarping = false; let targetCameraZ = 0; let targetControlsTargetZ = 0;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 9. アニメーションループ ---
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
        timelineSlider.value = camera.position.z - 25; camZValText.textContent = (camera.position.z - 25).toFixed(1);
    }

    controls.update(); updateDynamicViewportChunks();

    // 💡 3Dお星さま（☆）をさらに可愛く斜めスピン！
    clickableObjects.forEach(obj => {
        obj.rotation.y += 0.012; 
        obj.rotation.z += 0.004; // ほんの少し縦にも揺らすことで、浮遊感をアップ！
        if (obj.userData.beam && obj.userData.beam.userData.isExpanding && obj.userData.beam.scale.y < 1) {
            obj.userData.beam.scale.y += (1 - obj.userData.beam.scale.y) * 0.15;
        }
    });

    updateNotePosition(); renderer.render(scene, camera);
}

// 起動！
updateDynamicViewportChunks();
refreshHappinessRanking(); 
animate();