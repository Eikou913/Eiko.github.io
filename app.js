// --- 1. 基本セットアップ ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
scene.fog = new THREE.FogExp2(0x050608, 0.025);

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

// ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(15, 25, 15);
scene.add(dirLight);

// --- 2. 3D数直線（Z軸）の作成 ---
const zAxisLength = 60;
const zAxisGeom = new THREE.CylinderGeometry(0.1, 0.1, zAxisLength, 32).rotateX(Math.PI / 2);
const zAxisMat = new THREE.MeshStandardMaterial({ 
    color: 0x00d2ff, 
    emissive: 0x00a8ff, 
    emissiveIntensity: 0.3 
});
const zAxis = new THREE.Mesh(zAxisGeom, zAxisMat);
scene.add(zAxis);

// 数直線の目盛りラベルの定義
const timelineTicks = [
    { z: 30,  label: "2024.01" },
    { z: 20,  label: "2024.07" },
    { z: 10,  label: "2025.01" },
    { z: 0,   label: "2025.07" },
    { z: -10, label: "2026.01" },
    { z: -20, label: "2026.07" },
    { z: -30, label: "2027.01" }
];

// 目盛り線の自動生成
const majorTickGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16).rotateZ(Math.PI / 2);
const minorTickGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 16).rotateZ(Math.PI / 2);
const tickMaterial = new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00a8ff, emissiveIntensity: 0.2 });

for (let z = -30; z <= 30; z += 2) {
    const isMajor = timelineTicks.some(t => t.z === z);
    const tickMesh = new THREE.Mesh(isMajor ? majorTickGeom : minorTickGeom, tickMaterial);
    tickMesh.position.set(0, 0, z);
    scene.add(tickMesh);
}

// 動的文字テクスチャ作成関数
function createDateLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'Bold 26px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#00d2ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00a8ff';
    ctx.shadowBlur = 6;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.5, 0.875, 1);
    return sprite;
}

timelineTicks.forEach(tick => {
    const labelSprite = createDateLabel(tick.label);
    labelSprite.position.set(0, 0.8, tick.z);
    scene.add(labelSprite);
});

// --- 3. 人生記録プロット生成システム ---
const clickableObjects = [];
const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);

// 共通マテリアル（タップ時にcloneして光を立てる用）
const baseBeamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
});

function mapSatisfactionToX(sat) {
    return ((sat / 100) * 16) - 8;
}

// 💡 満足度に応じて球体の色を自動生成する知能
function getColorBySatisfaction(sat) {
    if (sat >= 80) return 0x2ed573; // 絶好調（緑）
    if (sat >= 40) return 0xffa500; // 普通（オレンジ）
    return 0xff4757;               // 低迷（赤）
}

// 💡 【重要】1つのデータから3Dオブジェクト一式を組み立てて空間へ配置する共通関数
function createPlotPoint(data) {
    const xPos = mapSatisfactionToX(data.x_sat);
    const color = getColorBySatisfaction(data.x_sat);

    // 1. 球体の生成
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.1
    });
    const sphere = new THREE.Mesh(sphereGeometry, mat);
    // 日付テキストからZ座標を簡易計算（プロトタイプ用に現在は現在時刻に基づくランダム、または固定設定用）
    // ※今回はベースコードのまま、指定されたz座標（なければ直近の未来/過去）に配置
    const zPos = data.z !== undefined ? data.z : (Math.random() * 40 - 20); 
    
    sphere.position.set(xPos, 0, zPos);
    
    // データ保持
    sphere.userData = {
        id: data.id,
        x_sat: data.x_sat,
        y_density: data.y_density,
        date: data.date,
        events: data.events,
        color: color
    };

    // 2. Y軸の光の柱の生成
    const beamHeight = data.y_density * 2.5; 
    const beamGeom = new THREE.CylinderGeometry(0.04, 0.04, beamHeight, 16);
    beamGeom.translate(0, beamHeight / 2, 0); 
    
    const yBeam = new THREE.Mesh(beamGeom, baseBeamMat.clone());
    yBeam.position.set(xPos, 0, zPos);
    yBeam.scale.y = 0.001; 
    scene.add(yBeam);
    
    sphere.userData.beam = yBeam;
    sphere.userData.beamHeight = beamHeight;

    scene.add(sphere);
    clickableObjects.push(sphere);
}

// 初期データの流し込み
const initialRecords = [
    { id: 1, z: 25, x_sat: 20, y_density: 1, date: "2024.04.12", events: ["【満足度20%: 低迷】プログラミングのエラーが解けず一日が終わる。密度は薄い。"] },
    { id: 2, z: 5, x_sat: 85, y_density: 2, date: "2025.08.19", events: ["【満足度85%: 旅の日】京都の一人旅。予定していなかった隠れ家的なカフェを発見。"] },
    { id: 3, z: -12, x_sat: 95, y_density: 3, date: "2026.06.02", events: ["【満足度95%: 最高の密度】新しい3Dライフログアプリの神UIロジックをひらめく！"] }
];
initialRecords.forEach(rec => createPlotPoint(rec));

// --- 4. 【新機能】入力フォームと3D空間の動的連動ロジック ---
const satInput = document.getElementById('input-sat');
const satValText = document.getElementById('sat-val');
const addBtn = document.getElementById('add-btn');

// スライダーを動かした時にパーセンテージ数値をリアルタイム更新
satInput.addEventListener('input', () => {
    satValText.textContent = `${satInput.value}%`;
});

// ボタンを押したときに、入力されたデータから新しい3Dノードを錬成する
addBtn.addEventListener('click', () => {
    const date = document.getElementById('input-date').value;
    const sat = parseInt(satInput.value);
    const density = parseInt(document.getElementById('input-density').value);
    const eventText = document.getElementById('input-event').value || "（イベント記載なし）";

    if(!date) { alert("日付を入力してください！"); return; }

    // 新しいデータオブジェクトの作成
    const newRecord = {
        id: Date.now(), // 擬似的なユニークID
        z: (Math.random() * 50 - 25), // プロトタイプ用にZ軸上のどこかにランダムプロット
        x_sat: sat,
        y_density: density,
        date: date,
        events: [eventText]
    };

    // 💡 魔法の発動：3D空間へ新しい記録の点を追加！
    createPlotPoint(newRecord);

    // 入力欄のクリア（日付とスライダーは残す）
    document.getElementById('input-event').value = "";
    
    // 演出：追加されたことが分かりやすいように、ちょっとカメラを揺らす等の処理をここに挟めます
    console.log("新ノードが3Dタイムライン上にプロットされました:", newRecord);
});

// --- 5. タップイベントと付箋UIの制御 ---
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
        data.events.forEach(evt => {
            eventsHtml += `<div class="event-item">${evt}</div>`;
        });
        noteEvents.innerHTML = eventsHtml;

        stickyNote.style.display = 'block';
        updateNotePosition();
        setTimeout(() => stickyNote.classList.add('active'), 10);
    } else {
        closeNote();
    }
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
    
    const currentBeamHeight = data.beamHeight * data.beam.scale.y;
    targetPosition.y += currentBeamHeight + 0.3; 

    targetPosition.project(camera);
    const x = (targetPosition.x * .5 + .5) * window.innerWidth;
    const y = (targetPosition.y * -.5 + .5) * window.innerHeight;

    stickyNote.style.left = `${x}px`;
    stickyNote.style.top = `${y}px`;
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

// --- 6. アニメーションループ ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    clickableObjects.forEach(obj => {
        obj.rotation.y += 0.01;
        if (obj.userData.beam && obj.userData.beam.userData.isExpanding) {
            if (obj.userData.beam.scale.y < 1) {
                obj.userData.beam.scale.y += (1 - obj.userData.beam.scale.y) * 0.15;
            }
        }
    });

    updateNotePosition();
    renderer.render(scene, camera);
}
animate();