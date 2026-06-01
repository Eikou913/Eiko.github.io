// --- 📱 スマホ専用：メニュー開閉制御システム ---
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const controlPanel = document.getElementById('control-panel');
const panelCloseBtn = document.getElementById('panel-close-btn');

menuToggleBtn.addEventListener('click', () => { controlPanel.classList.add('open'); });
panelCloseBtn.addEventListener('click', closeMenuPanel);
function closeMenuPanel() { controlPanel.classList.remove('open'); }

// --- 1. 基本セットアップ ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
// 💡 漆黒を追放し、恋する薄ピンクの癒やし背景空間を錬成
scene.background = new THREE.Color(0xfff0f3);
scene.fog = new THREE.FogExp2(0xfff0f3, 0.015); // フォグもピンクホワイトに

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

controls.maxDistance = 1000;
controls.minDistance = 1;

// 💡 空間を明るくふんわり見せるためにライトをマイルドに強化
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffeef2, 0.8);
dirLight.position.set(15, 25, 15);
scene.add(dirLight);

// --- 2. データの脳みそ（パステル初期値） ---
const masterLifeRecords = [
    { id: 1, x_sat: 20, y_density: 1, date: "2026.04.12", events: ["ちょっと落ち込み気味な日。プログラミングのエラーが解けなかったの。"] },
    { id: 2, x_sat: 85, y_density: 2, date: "2026.05.19", events: ["京都の一人旅。かわいい隠れ家カフェを見つけてテンションアップ🌸"] },
    { id: 3, x_sat: 95, y_density: 3, date: "2026.06.02", events: ["3D日記アプリの最高に可愛いUIシステムをひらめいた日！天才かも✨"] },
    { id: 4, x_sat: 60, y_density: 1, date: "2026.07.10", events: ["未来のわたしへ。数直線がどんどんパステル色に染まっていくよ。"] }
];

function getBaseDate() {
    if (masterLifeRecords.length === 0) return new Date(2026, 5, 2);
    const dates = masterLifeRecords.map(r => {
        const p = r.date.split('.');
        return new Date(parseInt(p[0]), parseInt(p[1]) - 1, p[2] ? parseInt(p[2]) : 1);
    });
    return new Date(Math.min(...dates));
}

function getScaleMultiplier() {
    const scaleMode = document.getElementById('timeline-scale').value;
    if (scaleMode === 'week')  return 3.0 / 7.0;  
    if (scaleMode === 'month') return 3.0 / 30.0; 
    return 3.0;                                   
}

function mapDateToZ(dateStr) {
    const parts = dateStr.split('.');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parts[2] ? parseInt(parts[2]) : 1;
    if (isNaN(year)) return camera.position.z - 10;
    const baseDate = getBaseDate();
    const targetDate = new Date(year, month - 1, day);
    return -(targetDate - baseDate) / (1000 * 60 * 60 * 24) * getScaleMultiplier();
}

function mapSatisfactionToX(sat) { return ((sat / 100) * 16) - 8; }

// 💡 【大改造】トゲトゲしい色を廃止し、マカロンみたいなパステルカラーに変更！
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0xff758f; // 絶好調：ストロベリーピンク
    if (sat >= 40) return 0xffca3a; // 普通：マイルドレモンイエロー
    return 0x90e0ef;               // 低迷：ラムネソーダブルー
}

// --- 3. クッキリテキスト（可愛いフォントでCanvas生成） ---
const textureCache = new Map();
function createDateLabel(text, customColorHex = 0xff758f) {
    const cacheKey = `${text}_${customColorHex}`;
    if (textureCache.has(cacheKey)) return textureCache.get(cacheKey).clone();

    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 💡 フォントをまるっこい「Quicksand」に変更！
    ctx.font = 'Bold 84px "Quicksand", Arial, sans-serif';
    const colorStr = `#${customColorHex.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = colorStr; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 117, 143, 0.3)'; ctx.shadowBlur = 15;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.5, 0.875, 1);
    textureCache.set(cacheKey, sprite);
    return sprite;
}

// --- 4. タイムライン・ビルディングシステム ---
const activeObjectsMap = new Map(); 
const clickableObjects = [];        

const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
const spotTickGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24).rotateX(Math.PI / 2);
const baseBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });

function updateDynamicViewportChunks() {
    const currentKeys = new Set();
    if (masterLifeRecords.length === 0) return;

    const zPositions = masterLifeRecords.map(r => mapDateToZ(r.date));
    const maxZ = Math.max(...zPositions); 
    const minZ = Math.min(...zPositions); 

    let timelineLine = activeObjectsMap.get("built_line");
    if (timelineLine) scene.remove(timelineLine); 

    const lineLength = Math.abs(maxZ - minZ) + 10; 
    const lineCenterZ = (maxZ + minZ) / 2;

    const lineGeom = new THREE.CylinderGeometry(0.04, 0.04, lineLength, 32).rotateX(Math.PI / 2);
    // 💡 数直線レール自体を、優しい「ミルキーピンクホワイト」にコーティング
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffd6ba, emissive: 0xffb3c6, emissiveIntensity: 0.2, roughness: 0.3 });
    timelineLine = new THREE.Mesh(lineGeom, lineMat);
    timelineLine.position.set(0, 0, lineCenterZ);
    scene.add(timelineLine);
    activeObjectsMap.set("built_line", timelineLine);
    currentKeys.add("built_line");

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
            const mat = new THREE.MeshStandardMaterial({ color: displayColor, emissive: displayColor, emissiveIntensity: 0.3, roughness: 0.2 });
            const sphere = new THREE.Mesh(sphereGeometry, mat);
            sphere.position.set(xPos, data.y_density * 1.5, tZ);
            group.add(sphere);

            // 2. Y軸光の柱
            const beamHeight = data.y_density * 1.5; 
            const beamGeom = new THREE.CylinderGeometry(0.02, 0.02, beamHeight, 16).translate(0, beamHeight / 2, 0);
            const yBeam = new THREE.Mesh(beamGeom, baseBeamMat.clone());
            yBeam.position.set(xPos, 0, tZ); yBeam.scale.y = 0.001; 
            group.add(yBeam);

            // 3. レーザー補助線（マイルドな半透明ピンク系に）
            const linePoints = [new THREE.Vector3(0, 0, tZ), new THREE.Vector3(xPos, 0, tZ)];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
            const lineMat = new THREE.LineBasicMaterial({ color: displayColor, transparent: true, opacity: 0.5 });
            group.add(new THREE.Line(lineGeom, lineMat));

            // 4. 専用目盛り（ネオンリング ➔ 可愛いカラーリングに）
            const spotTick = new THREE.Mesh(spotTickGeom, new THREE.MeshBasicMaterial({ color: displayColor }));
            spotTick.position.set(0, 0, tZ);
            group.add(spotTick);

            // 5. 目盛りの上の日付文字
            const dateLabel = createDateLabel(data.date, displayColor);
            dateLabel.position.set(0, 0.8, tZ);
            group.add(dateLabel);

            sphere.userData = { id: data.id, x_sat: data.x_sat, y_density: data.y_density, date: data.date, events: data.events, myColor: origColor, beam: yBeam };
            clickableObjects.push(sphere);

            scene.add(group);
            activeObjectsMap.set(nodeKey, group);
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

    const buffer = 40;
    timelineSlider.min = Math.floor(minZ - buffer);
    timelineSlider.max = Math.ceil(maxZ + buffer);
}

// --- 5. 次元ワープシステム ---
let isWarping = false;
let targetCameraZ = 0;
let targetControlsTargetZ = 0;

function warpToZCoordinate(zPos) {
    targetCameraZ = zPos + 25;
    targetControlsTargetZ = zPos;
    isWarping = true;
    closeNote();
}

// --- 6. 各種コンソール連動 ---
const timelineSlider = document.getElementById('timeline-slider');
const camZValText = document.getElementById('cam-z-val');
const tpInput = document.getElementById('tp-command-input');
const tpStatusMsg = document.getElementById('tp-status-msg');
const timelineScaleSelect = document.getElementById('timeline-scale');

timelineSlider.addEventListener('input', () => {
    if (isWarping) isWarping = false;
    const val = parseFloat(timelineSlider.value);
    camera.position.z = val + 25;
    controls.target.z = val;
    camZValText.textContent = val.toFixed(1);
});

timelineScaleSelect.addEventListener('change', () => {
    for(let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); }
    activeObjectsMap.clear(); clickableObjects.length = 0;
    updateDynamicViewportChunks();
    warpToZCoordinate(mapDateToZ(masterLifeRecords[0].date));
    closeMenuPanel(); 
});

tpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = tpInput.value.trim(); if (!cmd) return;
        const match = cmd.match(/^\/tp\s+(.+)$/);

        if (match) {
            const arg = match[1];
            if (!isNaN(arg)) {
                tpStatusMsg.style.color = "#ff758f"; tpStatusMsg.textContent = `[System] tp to coordinate ${arg}`;
                warpToZCoordinate(parseFloat(arg));
            } else {
                const targetZ = mapDateToZ(arg);
                tpStatusMsg.style.color = "#ff758f"; tpStatusMsg.textContent = `[System] tp to ${arg}`;
                warpToZCoordinate(targetZ);
            }
            setTimeout(closeMenuPanel, 800); 
        } else {
            tpStatusMsg.style.color = "#ff4757"; tpStatusMsg.textContent = `Unknown command. /tp [date]`;
        }
        tpInput.value = "";
    }
});

document.getElementById('add-btn').addEventListener('click', () => {
    const date = document.getElementById('input-date').value;
    const sat = parseInt(document.getElementById('input-sat').value);
    const density = parseInt(document.getElementById('input-density').value);
    const eventText = document.getElementById('input-event').value || "（イベント記載なし）";
    if(!date) { alert("日付を入力してください！"); return; }

    masterLifeRecords.push({ id: Date.now(), x_sat: sat, y_density: density, date: date, events: [eventText] });
    
    for(let [key, obj] of activeObjectsMap.entries()) { scene.remove(obj); } activeObjectsMap.clear(); clickableObjects.length = 0;
    updateDynamicViewportChunks();
    
    warpToZCoordinate(mapDateToZ(date));
    document.getElementById('input-event').value = "";
    closeMenuPanel(); 
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
        noteTitle.innerHTML = `<span>📅 ${data.date}</span> <span style="font-size:10px; color:#8a7a7f;">満足度: ${data.x_sat}%</span>`;
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
updateDynamicViewportChunks();
animate();