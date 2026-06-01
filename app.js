// --- 📖 【大修正】ノートを開くオープニング演出ロジック ---
const notebookOverlay = document.getElementById('notebook-overlay');

// 💡 PCのマウスクリックでも、スマホのタップでも100%確実に一瞬で動く「click」に統合します！
notebookOverlay.addEventListener('click', (event) => {
    // 💡 超重要：表紙をクリックしたエネルギーが、後ろの3D宇宙に突き抜けてカメラがガタつくのを防ぐ魔法
    event.stopPropagation();

    notebookOverlay.classList.add('opened');
}, false);

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

// --- 2. 👑 あなたの年表データ（2008〜2026） ---
const masterLifeRecords = [
    { id: 1, x_sat: 100, y_density: 3, date: "2008", events: ["おぎゃー！栄光王国に生まれる👶✨記念すべき人生のスタートライン！"] },
    { id: 2, x_sat: 95, y_density: 2, date: "2009", events: ["アンパンマンミュージアムにおでかけ🎡アンパンマンたちに会えてとってもはっぴーだったなぁ！"] },
    { id: 3, x_sat: 15, y_density: 3, date: "2011", events: ["インフルエンザにかかっちゃって、ずっと練習していた演劇の主役を涙の辞退...。かなしいウルウルブルーの日。"] },
    { id: 4, x_sat: 85, y_density: 2, date: "2012", events: ["妖怪ウォッチに大ブーム到来！ジバニャンたちと一緒に毎日ウォッチッチ⌚✨"] },
    { id: 5, x_sat: 90, y_density: 2, date: "2013", events: ["ルービックキューブに熱中！ついにカチカチと「6面すべて」をそろえることに大成功したよ！ピコピコ🧠"] },
    { id: 6, x_sat: 80, y_density: 1, date: "2013", events: ["かけひき無用のけんだまブーム！もしもしかめよ〜って毎日お部屋でいっぱい練習したおもいで🔴"] },
    { id: 7, x_sat: 95, y_density: 3, date: "2026", events: ["Tunecore運営さまと面談コーディネート🤝✨わたしの音楽活動が、これから大きく世界へ動き出す最高にハッピーな予感...！"] },
    { id: 8, x_sat: 60, y_density: 2, date: "2026", events: ["学校を退学する。これからの自分の人生のレールを、自らの手で美しくビルドしていくための、大きな前向きな一歩。"] }
];

function getBaseDate() { return new Date(2008, 0, 1); }

function getScaleMultiplier() {
    const scaleMode = document.getElementById('timeline-scale').value;
    if (scaleMode === 'week') return 3.0 / 7.0;
    if (scaleMode === 'month') return 3.0 / 30.0;
    return 3.0;
}

function mapDateToZ(dateStr) {
    const parts = dateStr.split('.');
    const year = parseInt(parts[0]); const month = parts[1] ? parseInt(parts[1]) : 1; const day = parts[2] ? parseInt(parts[2]) : 1;
    if (isNaN(year)) return camera.position.z - 10;
    const baseDate = getBaseDate(); const targetDate = new Date(year, month - 1, day);
    return -(targetDate - baseDate) / (1000 * 60 * 60 * 24) * getScaleMultiplier();
}

function getCalculatedZ(data, index) {
    const scaleMode = document.getElementById('timeline-scale').value;
    if (scaleMode === 'custom') { return -index * 4.5; }
    return mapDateToZ(data.date);
}

function mapSatisfactionToX(sat) { return ((sat / 100) * 16) - 8; }
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0xff758f;
    if (sat >= 40) return 0xffca3a;
    return 0x90e0ef;
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
    const shape = new THREE.Shape(); const spikes = 5; const outerRadius = 0.55; const innerRadius = 0.23;
    let rot = Math.PI / 2 * 3; let x = 0; let y = 0; const step = Math.PI / spikes;
    shape.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius; y = Math.sin(rot) * outerRadius; shape.lineTo(x, y); rot += step;
        x = Math.cos(rot) * innerRadius; y = Math.sin(rot) * innerRadius; shape.lineTo(x, y); rot += step;
    }
    shape.lineTo(0, -outerRadius);
    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.03, bevelThickness: 0.03 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings); geom.center(); return geom;
}
const starGeometry = createStarGeometry();

// --- 5. タイムライン・ビルディングシステム ---
const activeObjectsMap = new Map(); const clickableObjects = [];
const spotTickGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24).rotateX(Math.PI / 2);
const baseBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });

function updateDynamicViewportChunks() {
    const currentKeys = new Set();
    if (masterLifeRecords.length === 0) return;

    const zPositions = masterLifeRecords.map((r, i) => getCalculatedZ(r, i));
    const maxZ = Math.max(...zPositions); const minZ = Math.min(...zPositions);

    let timelineLine = activeObjectsMap.get("built_line");
    if (timelineLine) scene.remove(timelineLine);

    const lineLength = Math.abs(maxZ - minZ) + 10; const lineCenterZ = (maxZ + minZ) / 2;
    const lineGeom = new THREE.CylinderGeometry(0.04, 0.04, lineLength, 32).rotateX(Math.PI / 2);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffd6ba, emissive: 0xffb3c6, emissiveIntensity: 0.2, roughness: 0.3 });
    timelineLine = new THREE.Mesh(lineGeom, lineMat); timelineLine.position.set(0, 0, lineCenterZ);
    scene.add(timelineLine); activeObjectsMap.set("built_line", timelineLine); currentKeys.add("built_line");

    masterLifeRecords.forEach((data, index) => {
        const tZ = getCalculatedZ(data, index);
        const nodeKey = `node_${data.id}`; currentKeys.add(nodeKey);

        if (!activeObjectsMap.has(nodeKey)) {
            const group = new THREE.Group(); const xPos = mapSatisfactionToX(data.x_sat);
            const mode = document.getElementById('color-mode').value; const pickerColor = document.getElementById('input-picker-color').value;

            let origColor = getColorBySatisfaction(data.x_sat);
            if (mode === 'manual') origColor = parseInt(pickerColor.replace('#', '0x'));
            let displayColor = mode === 'white' ? 0xffffff : origColor;

            const mat = new THREE.MeshStandardMaterial({ color: displayColor, emissive: displayColor, emissiveIntensity: 0.3, roughness: 0.2 });
            const starMesh = new THREE.Mesh(starGeometry, mat); starMesh.position.set(xPos, data.y_density * 1.5, tZ); group.add(starMesh);

            const beamHeight = data.y_density * 1.5;
            const beamGeom = new THREE.CylinderGeometry(0.02, 0.02, beamHeight, 16).translate(0, beamHeight / 2, 0);
            const yBeam = new THREE.Mesh(beamGeom, baseBeamMat.clone()); yBeam.position.set(xPos, 0, tZ); yBeam.scale.y = 0.001; group.add(yBeam);

            const linePoints = [new THREE.Vector3(0, 0, tZ), new THREE.Vector3(xPos, 0, tZ)];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
            group.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.5 })));

            const spotTick = new THREE.Mesh(spotTickGeom, new THREE.MeshBasicMaterial({ color: displayColor })); spotTick.position.set(0, 0, tZ); group.add(spotTick);

            const dateLabel = createDateLabel(data.date, displayColor); dateLabel.position.set(0, 0.8, tZ); group.add(dateLabel);

            starMesh.userData = { id: data.id, x_sat: data.x_sat, y_density: data.y_density, date: data.date, index: index, events: data.events, myColor: origColor, beam: yBeam };
            clickableObjects.push(starMesh); scene.add(group); activeObjectsMap.set(nodeKey, group);
        }
    });

    for (let [key, obj] of activeObjectsMap.entries()) {
        if (!currentKeys.has(key)) {
            scene.remove(obj); activeObjectsMap.delete(key);
            if (key.startsWith("node_")) {
                const clickIdx = clickableObjects.indexOf(obj.children[0]); if (clickIdx > -1) clickableObjects.splice(clickIdx, 1);
            }
        }
    }

    const buffer = 30;
    timelineSlider.min = Math.floor(minZ - buffer); timelineSlider.max = Math.ceil(maxZ + buffer);
}

// --- 6. YouTubeアナリティクス風ランキング ---
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
            const rankNum = index + 1; let badgeClass = "rank-other";
            if (rankNum === 1) badgeClass = "rank-1"; if (rankNum === 2) badgeClass = "rank-2"; if (rankNum === 3) badgeClass = "rank-3";
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

window.warpToRecordFromRanking = function (id) {
    const recIdx = masterLifeRecords.findIndex(r => r.id === id);
    if (recIdx > -1) { closeMenuPanel(); warpToZCoordinate(getCalculatedZ(masterLifeRecords[recIdx], recIdx)); }
};

// --- 7. スライダー ＆ コマンドシステム連動 ---
const timelineSlider = document.getElementById('timeline-slider');
const camZValText = document.getElementById('cam-z-val');
const tpInput = document.getElementById('tp-command-input');
const tpStatusMsg = document.getElementById('tp-status-msg');
const timelineScaleSelect = document.getElementById('timeline-scale');

let isUserDraggingSlider = false;

timelineSlider.addEventListener('mousedown', () => { isUserDraggingSlider = true; });
timelineSlider.addEventListener('mouseup', () => { isUserDraggingSlider = false; });
timelineSlider.addEventListener('touchstart', () => { isUserDraggingSlider = true; }, { passive: true });
timelineSlider.addEventListener('touchend', () => { isUserDraggingSlider = false; });

timelineSlider.addEventListener('input', () => {
    if (isWarping) isWarping = false;
    const val = parseFloat(timelineSlider.value);
    const currentDiffZ = camera.position.z - controls.target.z;
    controls.target.set(0, 1, val);
    camera.position.z = val + currentDiffZ;
    camZValText.textContent = val.toFixed(1);
});

timelineScaleSelect.addEventListener('change', () => {
    for (let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); }
    activeObjectsMap.clear(); clickableObjects.length = 0;
    updateDynamicViewportChunks();
    warpToZCoordinate(getCalculatedZ(masterLifeRecords[0], 0)); closeMenuPanel();
});

tpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = tpInput.value.trim(); if (!cmd) return;
        const match = cmd.match(/^\/tp\s+(.+)$/);
        if (match) {
            const arg = match[1]; const recIdx = masterLifeRecords.findIndex(r => r.date === arg);
            if (recIdx > -1) {
                const targetZ = getCalculatedZ(masterLifeRecords[recIdx], recIdx);
                tpStatusMsg.style.color = "#ff758f"; tpStatusMsg.textContent = `[System] tp to ${arg}年`;
                warpToZCoordinate(targetZ);
            } else if (!isNaN(arg)) {
                tpStatusMsg.style.color = "#ff758f"; tpStatusMsg.textContent = `[System] tp coordinate ${arg}`;
                warpToZCoordinate(parseFloat(arg));
            } else {
                tpStatusMsg.style.color = "#ff4757"; tpStatusMsg.textContent = `年表データが見つかりません。`;
            }
            setTimeout(closeMenuPanel, 800);
        } else { tpStatusMsg.style.color = "#ff4757"; tpStatusMsg.textContent = `Unknown command.`; }
        tpInput.value = "";
    }
});

document.getElementById('add-btn').addEventListener('click', () => {
    const date = document.getElementById('input-date').value; const sat = parseInt(document.getElementById('input-sat').value);
    const density = parseInt(document.getElementById('input-density').value); const eventText = document.getElementById('input-event').value || "（イベント記載なし）";
    if (!date) { alert("年・日付を入力してください！"); return; }
    const newRec = { id: Date.now(), x_sat: sat, y_density: density, date: date, events: [eventText] };
    masterLifeRecords.push(newRec);
    for (let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); } activeObjectsMap.clear(); clickableObjects.length = 0;
    updateDynamicViewportChunks(); refreshHappinessRanking();
    warpToZCoordinate(getCalculatedZ(newRec, masterLifeRecords.length - 1));
    document.getElementById('input-event').value = ""; closeMenuPanel();
});

document.getElementById('color-mode').addEventListener('change', () => {
    document.getElementById('picker-group').style.display = document.getElementById('color-mode').value === 'manual' ? 'block' : 'none';
    for (let [key, obj] of activeObjectsMap.entries()) { if (key.startsWith("node_")) { scene.remove(obj); activeObjectsMap.delete(key); } }
    clickableObjects.length = 0; updateDynamicViewportChunks();
});

// --- 8. 🛠️ 【大改造】PC・スマホ両対応：ドラッグ＆タップ完全分離システム ---
const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2();
const stickyNote = document.getElementById('sticky-note');
const noteTitle = document.getElementById('note-title'); const noteEvents = document.getElementById('note-events');
let activeSphere = null;

// 💡 触れた瞬間の「画面のX・Y座標」を一時的に記憶する箱
let startX = 0;
let startY = 0;

// ① 画面にタッチ、またはマウスクリックが始まった瞬間
window.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
}, false);

// ② 指を離した、またはマウスを離した瞬間
window.addEventListener('pointerup', (event) => {
    // ➔ UIを操作している時（メニュー内やシークバーなど）は、3Dのタップ判定をスキップする安全ガード
    if (event.target.id !== 'canvas-container' && event.target.tagName !== 'CANVAS') return;

    // 💡 押した位置と離した位置の距離（ズレ）を測定
    const diffX = Math.abs(event.clientX - startX);
    const diffY = Math.abs(event.clientY - startY);

    // ➔ もし指が「4ピクセル以上」動いていたら、それは画面の回転操作（ドラッグ）なので、タップ処理を完全にスルー！
    if (diffX > 4 || diffY > 4) return;

    // ➔ ズレが4ピクセル以内なら、純粋な「マウスクリック」または「スマホのポンッというタップ」とみなし、Raycasterを起動！
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        resetActiveEffects(); activeSphere = intersects[0].object; const data = activeSphere.userData;
        data.beam.material.opacity = 0.4; data.beam.userData.isExpanding = true;
        noteTitle.innerHTML = `<span>📅 ${data.date}年</span> <span style="font-size:10px; color:#8a7a7f;">満足度: ${data.x_sat}%</span>`;
        let eventsHtml = ""; data.events.forEach(evt => { eventsHtml += `<div class="event-item">${evt}</div>`; });
        noteEvents.innerHTML = eventsHtml; stickyNote.style.display = 'block';
        updateNotePosition(); setTimeout(() => stickyNote.classList.add('active'), 10);
    } else { closeNote(); }
}, false);

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
function warpToZCoordinate(zPos) { targetCameraZ = zPos + 25; targetControlsTargetZ = zPos; isWarping = true; closeNote(); }

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- 9. アニメーションループ ---
function animate() {
    requestAnimationFrame(animate);

    if (isWarping) {
        camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
        controls.target.z += (targetControlsTargetZ - controls.target.z) * 0.08;
        timelineSlider.value = controls.target.z;
        camZValText.textContent = controls.target.z.toFixed(1);
        if (Math.abs(camera.position.z - targetCameraZ) < 0.1) {
            camera.position.z = targetCameraZ; controls.target.set(0, 1, targetControlsTargetZ); isWarping = false;
        }
    } else {
        if (!isUserDraggingSlider) {
            timelineSlider.value = controls.target.z; camZValText.textContent = controls.target.z.toFixed(1);
        }
    }

    controls.update(); updateDynamicViewportChunks();

    clickableObjects.forEach(obj => {
        obj.rotation.y += 0.012; obj.rotation.z += 0.004;
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