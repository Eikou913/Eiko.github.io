/**
 * 🌃 Memory City - High Fidelity Night Walk Edition
 */

// ==========================================
// 1. DOM要素の取得 & 画面遷移
// ==========================================
const topScreen = document.getElementById('top-page-screen');
const myScreen = document.getElementById('my-page-screen');
const notebookOverlay = document.getElementById('notebook-overlay');
const canvasContainer = document.getElementById('canvas-container');
const myUiLayer = document.getElementById('my-ui-layer');
const cinematicYear = document.getElementById('cinematic-year');
const toTopBtn = document.getElementById('to-top-btn');
const toMyBtn = document.getElementById('to-my-btn');

topScreen.style.display = "block";
myScreen.style.display = "none";

toTopBtn.addEventListener('click', () => {
    topScreen.style.display = "block";
    myScreen.style.display = "none";
    toTopBtn.classList.add('active');
    toMyBtn.classList.remove('active');
});

toMyBtn.addEventListener('click', () => {
    topScreen.style.display = "none";
    myScreen.style.display = "block";
    notebookOverlay.style.display = "flex";
    notebookOverlay.classList.remove('opened');
    canvasContainer.style.display = "none";
    myUiLayer.style.display = "none";
    toTopBtn.classList.remove('active');
    toMyBtn.classList.add('active');
});

// ノートタップ時のズームトランジション
notebookOverlay.addEventListener('click', () => {
    notebookOverlay.classList.add('opened'); 
    setTimeout(() => {
        notebookOverlay.style.display = "none";
        canvasContainer.style.display = "block";
        myUiLayer.style.display = "block";
        initCity(); 
    }, 1000);
});

// ==========================================
// 2. Three.js セットアップ (街灯のある夜の街)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c14); // 少し明るい夜の街の空
scene.fog = new THREE.FogExp2(0x0a0c14, 0.015); // 霧を薄くして見通しを良くする

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

// アンビエントライト（街全体のベースの明るさ）をアップ
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// ==========================================
// 3. テクスチャ生成
// ==========================================
function createStreetFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#11131a'; // アスファルト
    ctx.fillRect(0, 0, 512, 512);
    for(let i=0; i<3000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.04})`;
        ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 50);
    // 床も光を少し反射させる
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.2 });
}

function createCityWall() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#08090d'; // ビルの壁
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#030406';
    ctx.lineWidth = 4;
    for(let y=0; y<8; y++) {
        for(let x=0; x<8; x++) {
            ctx.strokeRect(x*64, y*64, 64, 64);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 1);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
}

// ★ 画質を限界まで高め、アクリルガラスのような反射(Clearcoat)を追加した看板
function createHighFidelityBillboard(date, text) {
    const canvas = document.createElement('canvas');
    // 解像度を4倍にしてベクターのような鮮明さを出す
    canvas.width = 2048; canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 黒いアクリルベース
    ctx.fillStyle = 'rgba(8, 10, 15, 0.95)';
    ctx.fillRect(0, 0, 2048, 1024);
    
    // 白い光るフレーム
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 2008, 984);

    // 年号
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 160px Montserrat';
    ctx.fillText(date, 100, 240);

    // テキスト
    ctx.fillStyle = '#eeeeee';
    ctx.font = '72px Noto Sans JP';
    let line = '';
    let y = 420;
    for(let i=0; i<text.length; i++) {
        let test = line + text[i];
        if (ctx.measureText(test).width > 1800 && i > 0) {
            ctx.fillText(line, 100, y);
            line = text[i];
            y += 100;
        } else {
            line = test;
        }
    }
    ctx.fillText(line, 100, y);

    const tex = new THREE.CanvasTexture(canvas);
    // 斜めから見ても文字がぼやけない魔法の処理（異方性フィルタリング）
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;

    // 物理ベースマテリアルで「光を反射するガラスの看板」を表現
    return new THREE.MeshPhysicalMaterial({ 
        map: tex, 
        emissive: 0xffffff, 
        emissiveMap: tex, 
        emissiveIntensity: 0.6, // 文字が自ら発光する
        roughness: 0.1, // ツルツル
        metalness: 0.5,
        clearcoat: 1.0, // 表面のクリアな反射（ガラス感）
        clearcoatRoughness: 0.1
    });
}

// ==========================================
// 4. データと街の建築
// ==========================================
const masterLifeRecords = [
    { date: "2008", text: "おぎゃー！栄光王国に生まれる。" },
    { date: "2010", text: "アンパンマンミュージアムにおでかけ！" },
    { date: "2013", text: "妖怪ウォッチにハマる。インフルエンザで演劇主役を辞退。" },
    { date: "2015", text: "ルービックキューブで6面そろえる。漢字テスト事件。" },
    { date: "2019", text: "いじめ事件。のちにこれが音楽への原動力となる。" },
    { date: "2021", text: "Maestroで作曲開始。世界が音で満ち始めた。" },
    { date: "2026", text: "Tunecore運営と面談。人生の新たなフェーズへ。" }
];

let cityGroup = new THREE.Group();
scene.add(cityGroup);
let activeZones = [];

const STREET_W = 20;
const STREET_H = 15;

function initCity() {
    scene.remove(cityGroup);
    cityGroup = new THREE.Group();
    scene.add(cityGroup);
    activeZones = [];
    
    const streetLength = masterLifeRecords.length * 40 + 60;

    // 床と壁
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(STREET_W, streetLength), createStreetFloor());
    floor.rotation.x = -Math.PI / 2; floor.position.z = -streetLength/2 + 20;
    cityGroup.add(floor);

    const wallMat = createCityWall();
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(streetLength, STREET_H), wallMat);
    wallL.rotation.y = Math.PI / 2; wallL.position.set(-STREET_W/2, STREET_H/2, -streetLength/2 + 20);
    cityGroup.add(wallL);

    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(streetLength, STREET_H), wallMat);
    wallR.rotation.y = -Math.PI / 2; wallR.position.set(STREET_W/2, STREET_H/2, -streetLength/2 + 20);
    cityGroup.add(wallR);

    // 街灯と看板の配置
    masterLifeRecords.forEach((data, index) => {
        const zPos = -index * 40 - 20;
        const isLeft = index % 2 === 0;
        
        activeZones.push({ z: zPos, date: data.date });

        // 街灯の光 (暖色系のスポットライト)
        const light = new THREE.SpotLight(0xffeebb, 60, 40, Math.PI/3, 0.5, 1.5);
        const lightX = isLeft ? -STREET_W/2 + 2 : STREET_W/2 - 2;
        light.position.set(lightX, STREET_H - 1, zPos + 2);
        
        // 看板 (超高画質・光沢アクリルボード)
        const boardGeo = new THREE.PlaneGeometry(8, 4); // パネルを少し大きく
        const boardMat = createHighFidelityBillboard(data.date, data.text);
        const board = new THREE.Mesh(boardGeo, boardMat);
        
        const boardX = isLeft ? -STREET_W/2 + 0.2 : STREET_W/2 - 0.2;
        board.position.set(boardX, 4, zPos);
        board.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        
        // 光の演出用ダミー球体（電球）
        const bulbGeo = new THREE.SphereGeometry(0.3);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeebb });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.copy(light.position);

        light.target = board;
        cityGroup.add(board, light, light.target, bulb);
    });
}

// ==========================================
// 5. FPS操作コントローラー (WASD + ドラッグ)
// ==========================================
// 歩行速度を少し落ち着いたスピードに調整
const walkSpeed = 9.0; 
const keys = { w: false, a: false, s: false, d: false };
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let euler = new THREE.Euler(0, 0, 0, 'YXZ');
let mobileDir = 0;

function startDrag(x, y) { isDragging = true; prevMouse = { x, y }; }
function stopDrag() { isDragging = false; }
function onDrag(x, y) {
    if (isDragging && canvasContainer.style.display === "block") {
        euler.setFromQuaternion(camera.quaternion);
        euler.y -= (x - prevMouse.x) * 0.005;
        euler.x -= (y - prevMouse.y) * 0.005;
        euler.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, euler.x));
        camera.quaternion.setFromEuler(euler);
        prevMouse = { x, y };
    }
}
canvasContainer.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', stopDrag);
window.addEventListener('mousemove', e => onDrag(e.clientX, e.clientY));
canvasContainer.addEventListener('touchstart', e => startDrag(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener('touchend', stopDrag);
window.addEventListener('touchmove', e => onDrag(e.touches[0].clientX, e.touches[0].clientY));

// キーボード
window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

// スマホ
const btnFwd = document.getElementById('btn-walk-fwd');
const btnBwd = document.getElementById('btn-walk-bwd');
btnFwd.addEventListener('touchstart', e => { e.preventDefault(); mobileDir = 1; });
btnFwd.addEventListener('touchend', e => { e.preventDefault(); mobileDir = 0; });
btnBwd.addEventListener('mousedown', e => { mobileDir = 1; });
btnBwd.addEventListener('mouseup', e => { mobileDir = 0; });
btnBwd.addEventListener('touchstart', e => { e.preventDefault(); mobileDir = -1; });
btnBwd.addEventListener('touchend', e => { e.preventDefault(); mobileDir = 0; });
btnBwd.addEventListener('mousedown', e => { mobileDir = -1; });
btnBwd.addEventListener('mouseup', e => { mobileDir = 0; });

// ==========================================
// 6. メインループ (歩行の揺れ・ベクトル計算)
// ==========================================
const clock = new THREE.Clock();
let headBobTimer = 0; 

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (canvasContainer.style.display === "block") {
        // ① 進行方向ベクトルの取得
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0; dir.normalize(); 
        
        // ★ A/Dキーの左右反転修正
        const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();

        let isMoving = false;
        const dist = walkSpeed * delta;

        // 前進・後退
        if (keys.w || mobileDir === 1) { camera.position.addScaledVector(dir, dist); isMoving = true; }
        if (keys.s || mobileDir === -1) { camera.position.addScaledVector(dir, -dist); isMoving = true; }
        // 左右カニ歩き
        if (keys.a) { camera.position.addScaledVector(right, -dist); isMoving = true; } // 左
        if (keys.d) { camera.position.addScaledVector(right, dist); isMoving = true; } // 右

        // 壁の衝突判定
        const limitX = STREET_W / 2 - 2;
        camera.position.x = Math.max(-limitX, Math.min(limitX, camera.position.x));
        camera.position.z = Math.min(10, camera.position.z);

        // ★ マイクラ風ヘッドボブ（歩行時の上下揺れ）
        if (isMoving) {
            headBobTimer += delta * 12; 
            camera.position.y = 4 + Math.sin(headBobTimer) * 0.12; // 自然な揺れ幅
        } else {
            camera.position.y += (4 - camera.position.y) * 0.1; // 停止時はスッと戻る
        }

        // 年号の表示更新
        if (activeZones.length > 0) {
            let nearest = activeZones[0];
            let minDiff = Infinity;
            activeZones.forEach(zone => {
                const diff = Math.abs(zone.z - camera.position.z);
                if (diff < minDiff) { minDiff = diff; nearest = zone; }
            });
            cinematicYear.textContent = nearest.date;
        }
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});