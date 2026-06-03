/**
 * 🏛️ Memory Museum - Realistic Brick & Cloud Edition
 */

// ==========================================
// 1. DOM要素の取得
// ==========================================
const topScreen = document.getElementById('top-page-screen');
const myScreen = document.getElementById('my-page-screen');
const notebookOverlay = document.getElementById('notebook-overlay');
const canvasContainer = document.getElementById('canvas-container');
const myUiLayer = document.getElementById('my-ui-layer');

const floatingLabelsContainer = document.getElementById('floating-labels-container');
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

const addBtn = document.getElementById('add-btn');
const stickyNote = document.getElementById('sticky-note');
const closeNoteBtn = document.getElementById('close-note-btn');

document.getElementById('input-sat').addEventListener('input', (e) => {
    document.getElementById('sat-val').textContent = e.target.value + '%';
});

// ==========================================
// 2. 画面切り替え
// ==========================================
topScreen.style.display = "block";
myScreen.style.display = "none";

toMyBtn.addEventListener('click', () => {
    topScreen.style.display = "none";
    myScreen.style.display = "block";
    notebookOverlay.style.display = "flex";
    notebookOverlay.classList.remove('opened');
    canvasContainer.style.display = "none";
    myUiLayer.style.display = "none";
    floatingLabelsContainer.style.display = "none";
    toTopBtn.classList.remove('active');
    toMyBtn.classList.add('active');
});

toTopBtn.addEventListener('click', () => {
    topScreen.style.display = "block";
    myScreen.style.display = "none";
    toTopBtn.classList.add('active');
    toMyBtn.classList.remove('active');
});

notebookOverlay.addEventListener('click', () => {
    notebookOverlay.classList.add('opened');
    setTimeout(() => {
        notebookOverlay.style.display = "none";
        canvasContainer.style.display = "block";
        myUiLayer.style.display = "block";
        floatingLabelsContainer.style.display = "block";
        initCorridor(); 
        renderer.render(scene, camera);
    }, 1000);
});

menuToggleBtn.onclick = () => { controlPanel.classList.toggle('open'); analyticsPanel.classList.remove('open'); };
analyticsToggleBtn.onclick = () => { analyticsPanel.classList.toggle('open'); controlPanel.classList.remove('open'); };
panelCloseBtn.onclick = () => { controlPanel.classList.remove('open'); };
analyticsCloseBtn.onclick = () => { analyticsPanel.classList.remove('open'); };
closeNoteBtn.onclick = () => { stickyNote.style.display = 'none'; };
timelineScaleSelect.addEventListener('change', initCorridor);

// ==========================================
// 3. Three.js セットアップ (リアルなライティング)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeae9e5);
scene.fog = new THREE.FogExp2(0xeae9e5, 0.012);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 3.5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 重さ対策
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔らかくリアルな影
renderer.physicallyCorrectLights = true; // 物理ベースの光演算
canvasContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3.5, 0);
controls.enablePan = false;

// リアルな環境光（空からの光と床の反射）
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xc2c0bc, 0.8);
scene.add(hemiLight);

// 太陽/メイン照明 (影を落とす)
const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
dirLight.position.set(5, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -20;
dirLight.shadow.camera.right = 20;
dirLight.shadow.camera.top = 20;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

// ==========================================
// 4. プログラムでテクスチャと雲を生成 (画像不要)
// ==========================================

// ① 白レンガのテクスチャをCanvasで自動生成
function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // ベースの白漆喰色
    ctx.fillStyle = '#f4f3f0';
    ctx.fillRect(0, 0, 512, 512);
    
    // 目地（グレー）
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#dcdad5';
    
    const rows = 16; const cols = 8;
    const brickH = 512 / rows; const brickW = 512 / cols;
    
    for(let y = 0; y < rows; y++) {
        const offset = (y % 2 === 0) ? 0 : brickW / 2;
        for(let x = -1; x < cols + 1; x++) {
            ctx.strokeRect(x * brickW + offset, y * brickH, brickW, brickH);
            // レンガに微細なノイズ質感を足す
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.02})`;
            ctx.fillRect(x * brickW + offset, y * brickH, brickW, brickH);
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(30, 2); // 壁全体にリピート
    return texture;
}

// ② 3Dの「雲」オブジェクトを生成する
function createCloud(colorHex) {
    const cloudGroup = new THREE.Group();
    // 質感: フラットシェーディングでモダンアート風に
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: colorHex,
        emissiveIntensity: 0.2, // ほんのり内側から光る
        roughness: 0.9,
        flatShading: true 
    });
    
    // ゴツゴツした球体を複数組み合わせて雲を作る
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const positions = [
        [0, 0, 0, 1.2],           // 中心
        [0.8, -0.2, 0.2, 0.8],    // 右
        [-0.8, -0.3, -0.1, 0.9],  // 左
        [0.4, 0.6, 0.1, 0.7],     // 右上
        [-0.5, 0.5, -0.2, 0.6]    // 左上
    ];
    
    positions.forEach(p => {
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.position.set(p[0], p[1], p[2]);
        mesh.scale.set(p[3], p[3], p[3]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        cloudGroup.add(mesh);
    });
    
    // 雲自体が周りの壁を照らすライト
    const light = new THREE.PointLight(colorHex, 0.8, 8);
    light.position.set(0, 0, 1);
    cloudGroup.add(light);
    
    return cloudGroup;
}

function createTextTexture(text, color, fontSize = 80) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512; canvas.height = 128;
    ctx.font = `bold ${fontSize}px Montserrat`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
}

function getNoteColor(sat) {
    if (sat >= 75) return 0xfde047; // 幸福：イエロー
    if (sat >= 40) return 0xf9a8d4; // 普通：ピンク
    return 0x93c5fd; // 試練：ブルー
}

// ==========================================
// 5. マスターデータと空間構築
// ==========================================
const masterLifeRecords = [
    { id: 1, x_sat: 100, date: "2008", events: ["おぎゃー！栄光王国に生まれる"], category: "誕生" },
    { id: 2, x_sat: 95, date: "2010", events: ["アンパンマンミュージアムにおでかけ！"], category: "イベント" },
    { id: 3, x_sat: 15, date: "2013", events: ["インフルエンザにて演劇の主役を辞退"], category: "試練" },
    { id: 4, x_sat: 85, date: "2013", events: ["妖怪ウォッチにハマる"], category: "ゲーム" },
    { id: 5, x_sat: 95, date: "2015", events: ["ルービックキューブで6面そろえる"], category: "達成" },
    { id: 6, x_sat: 20, date: "2015", events: ["漢字テストでカンニングされる"], category: "事件" },
    { id: 7, x_sat: 10, date: "2019", events: ["いじめ事件"], category: "試練" },
    { id: 8, x_sat: 95, date: "2021", events: ["Maestroで作曲開始"], category: "音楽" },
    { id: 9, x_sat: 80, date: "2026", events: ["Tunecore運営と面談"], category: "飛躍" }
];

let activeObjects = []; 
let clickableObjects = []; 
let floatingLabels = []; 
let corridorGroup = new THREE.Group();
scene.add(corridorGroup);

const ROOM_WIDTH = 16;
const ROOM_HEIGHT = 12;
const ROOM_LENGTH = 3000;
const brickTexture = createBrickTexture(); // 生成したレンガテクスチャ

function initCorridor() {
    scene.remove(corridorGroup);
    corridorGroup = new THREE.Group();
    scene.add(corridorGroup);
    activeObjects = []; clickableObjects = []; floatingLabels = [];
    floatingLabelsContainer.innerHTML = '';

    // ① 美術館の室内（レンガ壁とコンクリ床）
    const wallGeo = new THREE.PlaneGeometry(ROOM_LENGTH, ROOM_HEIGHT);
    const floorGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_LENGTH);
    
    const wallMat = new THREE.MeshStandardMaterial({ map: brickTexture, roughness: 0.9 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.4 });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -ROOM_LENGTH/2 + 100); floor.receiveShadow = true;
    
    const wallL = new THREE.Mesh(wallGeo, wallMat);
    wallL.rotation.y = Math.PI / 2; wallL.position.set(-ROOM_WIDTH/2, ROOM_HEIGHT/2, -ROOM_LENGTH/2 + 100); wallL.receiveShadow = true;
    
    const wallR = new THREE.Mesh(wallGeo, wallMat);
    wallR.rotation.y = -Math.PI / 2; wallR.position.set(ROOM_WIDTH/2, ROOM_HEIGHT/2, -ROOM_LENGTH/2 + 100); wallR.receiveShadow = true;

    corridorGroup.add(floor, wallL, wallR);

    // ② アーチと雲の配置
    const scaleMode = timelineScaleSelect.value;
    const archMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const pillarGeo = new THREE.BoxGeometry(1.5, ROOM_HEIGHT, 1.5);
    const beamGeo = new THREE.BoxGeometry(ROOM_WIDTH, 1.5, 1.5);

    let maxSliderValue = 0;

    if (scaleMode === 'year') {
        const groupedByYear = {};
        masterLifeRecords.forEach(r => {
            const year = r.date.substring(0, 4);
            if (!groupedByYear[year]) groupedByYear[year] = [];
            groupedByYear[year].push(r);
        });

        let archIndex = 0;
        for (const [year, records] of Object.entries(groupedByYear)) {
            const zPos = -archIndex * 50; 
            const group = new THREE.Group();

            const pL = new THREE.Mesh(pillarGeo, archMat); pL.position.set(-ROOM_WIDTH/2 + 0.75, ROOM_HEIGHT/2, 0); pL.castShadow = true; pL.receiveShadow = true;
            const pR = new THREE.Mesh(pillarGeo, archMat); pR.position.set(ROOM_WIDTH/2 - 0.75, ROOM_HEIGHT/2, 0); pR.castShadow = true; pR.receiveShadow = true;
            const beam = new THREE.Mesh(beamGeo, archMat); beam.position.set(0, ROOM_HEIGHT - 0.75, 0); beam.castShadow = true;
            
            const yearPlate = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), createTextTexture(year, "#888888"));
            yearPlate.position.set(0, ROOM_HEIGHT - 0.75, 0.76);

            group.add(pL, pR, beam, yearPlate);
            group.position.set(0, 0, zPos);
            corridorGroup.add(group);
            activeObjects.push({ z: zPos, date: year, event: `${year}年の展示室` });

            // 雲のアートワークを配置
            const eventSpacing = 50 / (records.length + 1);
            records.forEach((data, eIdx) => {
                buildCloudArtwork(data, zPos - (eventSpacing * (eIdx + 1)), eIdx);
            });
            archIndex++;
            maxSliderValue = Math.abs(zPos - 50);
        }
    } else {
        masterLifeRecords.forEach((data, index) => {
            const zPos = -index * 30;
            const group = new THREE.Group();

            const pL = new THREE.Mesh(pillarGeo, archMat); pL.position.set(-ROOM_WIDTH/2 + 0.75, ROOM_HEIGHT/2, 0); pL.castShadow = true;
            const pR = new THREE.Mesh(pillarGeo, archMat); pR.position.set(ROOM_WIDTH/2 - 0.75, ROOM_HEIGHT/2, 0); pR.castShadow = true;
            const beam = new THREE.Mesh(beamGeo, archMat); beam.position.set(0, ROOM_HEIGHT - 0.75, 0); beam.castShadow = true;
            
            const yearPlate = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), createTextTexture(data.date, "#888888"));
            yearPlate.position.set(0, ROOM_HEIGHT - 0.75, 0.76);

            group.add(pL, pR, beam, yearPlate);
            group.position.set(0, 0, zPos);
            corridorGroup.add(group);
            activeObjects.push({ z: zPos, date: data.date, event: data.events[0] });

            buildCloudArtwork(data, zPos - 5, index);
            maxSliderValue = Math.abs(zPos);
        });
    }

    timelineSlider.min = 0; timelineSlider.max = maxSliderValue; timelineSlider.value = 0;
    updateCameraPosition(0);
}

// 共通：雲のアートとHTML吹き出しを配置
function buildCloudArtwork(data, zPos, index) {
    const isLeft = index % 2 === 0;
    const noteColor = getNoteColor(data.x_sat);
    
    // 3Dの雲を生成
    const cloud = createCloud(noteColor);
    const xPos = isLeft ? -ROOM_WIDTH/2 + 1.2 : ROOM_WIDTH/2 - 1.2;
    cloud.position.set(xPos, 4, zPos);
    
    // クリック判定用にデータを親グループに付与
    cloud.userData = data;
    clickableObjects.push(cloud);
    corridorGroup.add(cloud);

    // HTMLの吹き出し
    const label = document.createElement('div');
    label.className = 'floating-label';
    label.innerHTML = `<strong>${data.date}</strong><br>${data.events[0]}`;
    floatingLabelsContainer.appendChild(label);
    
    floatingLabels.push({ 
        element: label, 
        position: new THREE.Vector3(isLeft ? xPos+1 : xPos-1, 6, zPos) 
    });
}

// ==========================================
// 6. ストリートビュー操作 & ナビゲーション
// ==========================================
function updateCameraPosition(sliderValue) {
    const targetZ = -sliderValue;
    camera.position.z = targetZ + 12;
    controls.target.z = targetZ;
    camZValText.textContent = Math.abs(targetZ).toFixed(0);
    
    if (activeObjects.length > 0) {
        let nearest = activeObjects[0];
        let minDiff = Infinity;
        activeObjects.forEach(obj => {
            const diff = Math.abs(obj.z - targetZ);
            if (diff < minDiff) { minDiff = diff; nearest = obj; }
        });
        cinematicYear.textContent = nearest.date;
        cinematicText.textContent = nearest.event;
    }
}
timelineSlider.addEventListener('input', () => updateCameraPosition(parseFloat(timelineSlider.value)));

addBtn.addEventListener('click', () => {
    const date = document.getElementById('input-date').value;
    const sat = parseInt(document.getElementById('input-sat').value);
    const eventText = document.getElementById('input-event').value || "NO DATA";
    if (!date) return;
    masterLifeRecords.push({ id: Date.now(), x_sat: sat, date: date, events: [eventText], category: "新規" });
    masterLifeRecords.sort((a, b) => parseInt(a.date.substring(0,4)) - parseInt(b.date.substring(0,4)));
    initCorridor();
    controlPanel.classList.remove('open');
});

// ==========================================
// 8. クリック判定 (雲に触れる)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (e) => {
    if (canvasContainer.style.display === "none" || e.target.closest('#my-ui-layer')) return; 
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    // Group内の子メッシュまで再帰的に判定する
    const intersects = raycaster.intersectObjects(clickableObjects, true);

    if (intersects.length > 0) {
        // クリックしたメッシュの親（Cloud Group）からuserDataを取得
        let obj = intersects[0].object;
        while(obj && !obj.userData.date) { obj = obj.parent; }
        
        if(obj) {
            const data = obj.userData;
            const hexColor = '#' + getNoteColor(data.x_sat).toString(16).padStart(6, '0');
            stickyNote.style.borderTopColor = hexColor;
            document.getElementById('note-title').innerHTML = `<span style="color:${hexColor}; font-weight:bold;">${data.date}</span> <span style="float:right; font-size:11px; color:#888;">SAT: ${data.x_sat}%</span>`;
            document.getElementById('note-events').textContent = data.events[0];
            stickyNote.style.display = 'block';
        }
    } else {
        stickyNote.style.display = 'none';
    }
});

// ==========================================
// 9. メインループ
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // 雲をゆっくり回転させて生きているように見せる
    clickableObjects.forEach(cloud => {
        cloud.rotation.y += 0.005;
        cloud.rotation.x += 0.002;
    });
    
    if (canvasContainer.style.display === "block") {
        floatingLabels.forEach(labelData => {
            const pos = labelData.position.clone();
            pos.project(camera);
            if (pos.z > 1) { labelData.element.classList.remove('visible'); return; }
            const x = (pos.x * .5 + .5) * window.innerWidth;
            const y = (pos.y * -.5 + .5) * window.innerHeight;
            labelData.element.style.left = `${x}px`;
            labelData.element.style.top = `${y}px`;

            const dist = camera.position.distanceTo(labelData.position);
            // 近づいた時だけ表示
            if (dist > 5 && dist < 25) { labelData.element.classList.add('visible'); } 
            else { labelData.element.classList.remove('visible'); }
        });
    }
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});