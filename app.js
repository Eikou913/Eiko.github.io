/**
 * 🌃 Memory City - High Fidelity Night Walk Edition (Ultimate)
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
const sprintIndicator = document.getElementById('sprint-indicator');

// モーダル関連
const modals = document.querySelectorAll('.modal-overlay');
const detailModal = document.getElementById('detail-modal');
const mapModal = document.getElementById('map-modal');
const addModal = document.getElementById('add-modal');
const settingsModal = document.getElementById('settings-modal');

topScreen.style.display = "block";
myScreen.style.display = "none";

document.getElementById('to-top-btn').addEventListener('click', () => {
    topScreen.style.display = "block"; myScreen.style.display = "none";
    document.getElementById('to-top-btn').classList.add('active'); document.getElementById('to-my-btn').classList.remove('active');
});

document.getElementById('to-my-btn').addEventListener('click', () => {
    topScreen.style.display = "none"; myScreen.style.display = "block";
    notebookOverlay.style.display = "flex"; notebookOverlay.classList.remove('opened');
    canvasContainer.style.display = "none"; myUiLayer.style.display = "none";
    document.getElementById('to-top-btn').classList.remove('active'); document.getElementById('to-my-btn').classList.add('active');
});

notebookOverlay.addEventListener('click', () => {
    notebookOverlay.classList.add('opened'); 
    setTimeout(() => {
        notebookOverlay.style.display = "none";
        canvasContainer.style.display = "block";
        myUiLayer.style.display = "block";
        initCity(); 
    }, 1000);
});

// モーダルを閉じる
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        modals.forEach(m => m.style.display = 'none');
    });
});

// ==========================================
// 2. Three.js セットアップ & 照明切り替え(夕方/夜)
// ==========================================
const scene = new THREE.Scene();
let isEvening = false;
const COLOR_NIGHT = new THREE.Color(0x0a0c14);
const COLOR_EVENING = new THREE.Color(0x3a1b12); // 夕焼けのセピア色

scene.background = COLOR_NIGHT;
scene.fog = new THREE.FogExp2(COLOR_NIGHT, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 4, 10); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const eveningLight = new THREE.DirectionalLight(0xffaa55, 0); // 夕方の太陽
eveningLight.position.set(0, 20, -50);
scene.add(ambientLight, eveningLight);

// 照明スイッチイベント
document.getElementById('btn-toggle-light').addEventListener('click', (e) => {
    isEvening = !isEvening;
    e.currentTarget.classList.toggle('active-light');
    
    // 背景とフォグの色をトランジションで変更するロジックはアニメーションループ内で処理
});

// ==========================================
// 3. テクスチャ生成 & マスターデータ
// ==========================================
let customWallTexture = null;
let streetWidth = 20;

function createStreetFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#11131a';
    ctx.fillRect(0, 0, 512, 512);
    for(let i=0; i<3000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.04})`;
        ctx.fillRect(Math.random()*512, Math.random()*512, 2, 2);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 50);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.2 });
}

function createCityWall() {
    if (customWallTexture) {
        return new THREE.MeshStandardMaterial({ map: customWallTexture, roughness: 0.8 });
    }
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#08090d'; 
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#030406'; ctx.lineWidth = 4;
    for(let y=0; y<8; y++) {
        for(let x=0; x<8; x++) { ctx.strokeRect(x*64, y*64, 64, 64); }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 1);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
}

function createHighFidelityBillboard(date, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(8, 10, 15, 0.95)';
    ctx.fillRect(0, 0, 2048, 1024);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 2008, 984);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 160px Montserrat';
    ctx.fillText(date, 100, 240);
    ctx.fillStyle = '#eeeeee';
    ctx.font = '72px Noto Sans JP';
    
    let line = ''; let y = 420;
    for(let i=0; i<text.length; i++) {
        let test = line + text[i];
        if (ctx.measureText(test).width > 1800 && i > 0) {
            ctx.fillText(line, 100, y); line = text[i]; y += 100;
        } else { line = test; }
    }
    ctx.fillText(line, 100, y);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    
    return new THREE.MeshPhysicalMaterial({ 
        map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.6,
        roughness: 0.1, metalness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.1
    });
}

const masterLifeRecords = [
    { date: "2008", text: "おぎゃー！生まれる" },
  { date: "2010", text: "アンパンマンミュージアムにおでかけ！" },
  { date: "2013", text: "インフルエンザにて演劇の主役を辞退！" },
  { date: "2013", text: "妖怪ウォッチにハマる" },
  { date: "2013", text: "鉄砲大会で優勝" },
  { date: "2014", text: "幼稚園でかき氷屋さん" },
  { date: "2014", text: "ピアノを習い始める" },
  { date: "2015", text: "ルービックキューブで6面そろえる" },
  { date: "2015", text: "書写の宿題で表彰される" },
  { date: "2015", text: "漢字テストでカンニングされる" },
  { date: "2015", text: "じゃんけん大会で優勝する" },
  { date: "2015", text: "けん玉にハマる" },
  { date: "2016", text: "車のCD(サカナクション、サザン、Boowyなど)に沼る" },
  { date: "2016", text: "コナンごっこ" },
  { date: "2016", text: "自分の3DSをゲット！" },
  { date: "2016", text: "電波人間に課金" },
  { date: "2016", text: "水泳を習い始める" },
  { date: "2016", text: "図工の授業中に告白して3番目に好きと言われる" },
  { date: "2016", text: "見せろ事件" },
  { date: "2016", text: "給食最後まで食べれず居残り" },
  { date: "2016", text: "川に飛び込む" },
  { date: "2016", text: "くつを川にぶん投げる" },
  { date: "2016", text: "かぎ紛失事件" },
  { date: "2016", text: "鍵盤ハーモニカで無双" },
  { date: "2017", text: "牛乳いたずらで先生ぶち切れ" },
  { date: "2017", text: "両想いの自由帳" },
  { date: "2017", text: "友達のリコーダーを川にぶん投げかける" },
  { date: "2017", text: "漫画を描き始める" },
  { date: "2018", text: "あだ名「えみこ」" },
  { date: "2018", text: "今でも恩人の先生" },
  { date: "2018", text: "校外学習でみんなを弄ぶクズ" },
  { date: "2018", text: "脳内作曲の開始" },
  { date: "2019", text: "パワハラ担任が君臨" },
  { date: "2019", text: "いじめ事件" },
  { date: "2019", text: "Switch買う" },
  { date: "2019", text: "おとめちゃん呼ばわり" },
  { date: "2019", text: "運命のフォークダンス" },
  { date: "2020", text: "神の日記" },
  { date: "2020", text: "学校を休んだ日の手紙" },
  { date: "2020", text: "ぞうたときりんこの話「落とし穴」" },
  { date: "2020", text: "2人きりのフォートナイト" },
  { date: "2020", text: "NCSに沼る" },
  { date: "2021", text: "フォートナイト告白爆死" },
  { date: "2021", text: "ピアノをやめる" },
  { date: "2021", text: "Maestroで作曲開始" },
  { date: "2021", text: "イヤイヤ期でロン毛突入" },
  { date: "2021", text: "パワハラ技術教師" },
  { date: "2022", text: "職場用PCをゲット" },
  { date: "2022", text: "友達0人ぼっちデビュー" },
  { date: "2022", text: "通塾開始" },
  { date: "2022", text: "Studio One Prime開始" },
  { date: "2023", text: "理科の動画が大成功" },
  { date: "2023", text: "トイレ事件" },
  { date: "2023", text: "FLStudioMobile開始" },
  { date: "2023", text: "学校飛び出して自殺未遂" },
  { date: "2023", text: "Studio One Artist開始" },
  { date: "2023", text: "祭りで会う約束" },
  { date: "2023", text: "塾をやめる" },
  { date: "2023", text: "ふられる" },
  { date: "2024", text: "高校合格" },
  { date: "2024", text: "ゲーミングPC購入" },
  { date: "2024", text: "卒業ディズニー" },
  { date: "2024", text: "入学式でひとめぼれ" },
  { date: "2024", text: "Filmora開始" },
  { date: "2024", text: "校外学習で撃沈→クラス中に好きな人情報が広まる" },
  { date: "2024", text: "音読で大爆死" },
  { date: "2024", text: "有料VSTを購入" },
  { date: "2024", text: "部長になる" },
  { date: "2024", text: "放課後の見えないデート" },
  { date: "2025", text: "家庭科でトラウマが蘇る" },
  { date: "2025", text: "2度目の自殺未遂" },
  { date: "2025", text: "精神科に通う" },
  { date: "2025/08/17", text: "Tunecoreの開始" },
  { date: "2025/11/2", text: "文化祭のバンド" },
  { date: "2026/03/31", text: "退学" },
  { date: "2026/04/01", text: "通信制に転校" },
  { date: "2026/05/10", text: "プログラミングを開始" },
];

let cityGroup = new THREE.Group();
scene.add(cityGroup);
let activeZones = [];
let clickableBoards = [];

function initCity() {
    scene.remove(cityGroup);
    cityGroup = new THREE.Group();
    scene.add(cityGroup);
    activeZones = [];
    clickableBoards = [];
    
    const streetLength = masterLifeRecords.length * 40 + 60;
    const STREET_H = 15;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(streetWidth, streetLength), createStreetFloor());
    floor.rotation.x = -Math.PI / 2; floor.position.z = -streetLength/2 + 20;
    cityGroup.add(floor);

    const wallMat = createCityWall();
    const wallL = new THREE.Mesh(new THREE.PlaneGeometry(streetLength, STREET_H), wallMat);
    wallL.rotation.y = Math.PI / 2; wallL.position.set(-streetWidth/2, STREET_H/2, -streetLength/2 + 20);
    cityGroup.add(wallL);

    const wallR = new THREE.Mesh(new THREE.PlaneGeometry(streetLength, STREET_H), wallMat);
    wallR.rotation.y = -Math.PI / 2; wallR.position.set(streetWidth/2, STREET_H/2, -streetLength/2 + 20);
    cityGroup.add(wallR);

    const mapListContainer = document.getElementById('map-list');
    mapListContainer.innerHTML = '';

    masterLifeRecords.forEach((data, index) => {
        const zPos = -index * 40 - 20;
        const isLeft = index % 2 === 0;
        activeZones.push({ z: zPos, date: data.date });

        // マップ（テレポート）用のリスト生成
        const mapItem = document.createElement('div');
        mapItem.className = 'map-item';
        mapItem.innerHTML = `<strong>${data.date}</strong> <span style="color:#aaa; font-size:12px;">${data.text.substring(0,10)}...</span>`;
        mapItem.onclick = () => {
            camera.position.z = zPos + 10; // テレポート
            mapModal.style.display = 'none';
        };
        mapListContainer.appendChild(mapItem);

        const light = new THREE.SpotLight(0xffeebb, 60, 40, Math.PI/3, 0.5, 1.5);
        const lightX = isLeft ? -streetWidth/2 + 2 : streetWidth/2 - 2;
        light.position.set(lightX, STREET_H - 1, zPos + 2);
        
        const boardGeo = new THREE.PlaneGeometry(8, 4); 
        const boardMat = createHighFidelityBillboard(data.date, data.text);
        const board = new THREE.Mesh(boardGeo, boardMat);
        
        const boardX = isLeft ? -streetWidth/2 + 0.2 : streetWidth/2 - 0.2;
        board.position.set(boardX, 4, zPos);
        board.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
        board.userData = data; // タップ用データ
        clickableBoards.push(board);
        
        const bulbGeo = new THREE.SphereGeometry(0.3);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeebb });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.copy(light.position);

        light.target = board;
        cityGroup.add(board, light, light.target, bulb);
    });
}

// ==========================================
// 4. Raycaster (タップで詳細表示)
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(e) {
    if (isDragging || canvasContainer.style.display === "none") return;
    
    // タッチかマウスかの判定
    let clientX = e.clientX; let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    }
    if(clientX === undefined) return;

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableBoards);

    if (intersects.length > 0) {
        const data = intersects[0].object.userData;
        document.getElementById('detail-date').textContent = data.date;
        document.getElementById('detail-text').textContent = data.text;
        detailModal.style.display = 'flex';
    }
}
window.addEventListener('click', onClick);
window.addEventListener('touchend', onClick); // スマホのタップ対応

// ==========================================
// 5. FPSコントローラー & ダッシュ機能 (長押し)
// ==========================================
const BASE_SPEED = 9.0;
const SPRINT_SPEED = 20.0;
let currentSpeed = BASE_SPEED;
let isSprinting = false;
let moveHoldTimer = 0; // 長押し判定用タイマー

const keys = { w: false, a: false, s: false, d: false };
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let euler = new THREE.Euler(0, 0, 0, 'YXZ');

// ドラッグ視点移動
function startDrag(x, y) { isDragging = true; prevMouse = { x, y }; }
function stopDrag() { isDragging = false; }
function onDrag(x, y) {
    if (isDragging && canvasContainer.style.display === "block" && detailModal.style.display === "none") {
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
// touchend は raycaster用と競合しないよう個別に処理
window.addEventListener('touchmove', e => onDrag(e.touches[0].clientX, e.touches[0].clientY));

window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

// 十字キー (D-Pad)
let mobileDir = { fwd: 0, right: 0 };
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

const addTouchAndMouse = (elem, prop, val) => {
    elem.addEventListener('mousedown', () => mobileDir[prop] = val);
    elem.addEventListener('mouseup', () => mobileDir[prop] = 0);
    elem.addEventListener('mouseleave', () => mobileDir[prop] = 0);
    elem.addEventListener('touchstart', (e) => { e.preventDefault(); mobileDir[prop] = val; });
    elem.addEventListener('touchend', (e) => { e.preventDefault(); mobileDir[prop] = 0; });
};
addTouchAndMouse(btnUp, 'fwd', 1);
addTouchAndMouse(btnDown, 'fwd', -1);
addTouchAndMouse(btnLeft, 'right', -1);
addTouchAndMouse(btnRight, 'right', 1);


// ==========================================
// 6. UIイベント (マップ, 追加, 設定)
// ==========================================
document.getElementById('btn-open-map').onclick = () => mapModal.style.display = 'flex';
document.getElementById('btn-open-add').onclick = () => addModal.style.display = 'flex';
document.getElementById('btn-open-settings').onclick = () => settingsModal.style.display = 'flex';

// レコード追加
document.getElementById('btn-submit-record').onclick = () => {
    const date = document.getElementById('add-date').value;
    const text = document.getElementById('add-text').value;
    if(date && text) {
        masterLifeRecords.push({ date, text });
        initCity();
        addModal.style.display = 'none';
        document.getElementById('add-date').value = '';
        document.getElementById('add-text').value = '';
    }
};

// 部屋・壁紙設定の適用
document.getElementById('btn-apply-settings').onclick = () => {
    streetWidth = parseInt(document.getElementById('street-width-slider').value);
    
    const fileInput = document.getElementById('upload-wallpaper');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                customWallTexture = new THREE.Texture(img);
                customWallTexture.needsUpdate = true;
                customWallTexture.wrapS = THREE.RepeatWrapping; 
                customWallTexture.wrapT = THREE.RepeatWrapping;
                customWallTexture.repeat.set(5, 1);
                initCity();
                settingsModal.style.display = 'none';
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        initCity();
        settingsModal.style.display = 'none';
    }
};


// ==========================================
// 7. メインループ (歩行の揺れ・ダッシュ・照明トランジション)
// ==========================================
const clock = new THREE.Clock();
let headBobTimer = 0; 

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (canvasContainer.style.display === "block") {
        
        // --- 照明・空色のトランジション (夕方 / 夜) ---
        const targetColor = isEvening ? COLOR_EVENING : COLOR_NIGHT;
        scene.background.lerp(targetColor, 0.02);
        scene.fog.color.lerp(targetColor, 0.02);
        const targetEnvLight = isEvening ? 1.0 : 0.5;
        ambientLight.intensity += (targetEnvLight - ambientLight.intensity) * 0.02;
        const targetSunLight = isEvening ? 0.8 : 0.0;
        eveningLight.intensity += (targetSunLight - eveningLight.intensity) * 0.02;


        // --- 歩行とダッシュ判定 ---
        const isFwd = keys.w || mobileDir.fwd === 1;
        if (isFwd) {
            moveHoldTimer += delta;
            if (moveHoldTimer > 0.3) { // 0.3秒長押しでダッシュ
                isSprinting = true;
                currentSpeed = SPRINT_SPEED;
                sprintIndicator.classList.add('show');
                camera.fov += (70 - camera.fov) * 0.1; // ダッシュ時は視野角を広げて疾走感を出す
            }
        } else {
            moveHoldTimer = 0;
            isSprinting = false;
            currentSpeed = BASE_SPEED;
            sprintIndicator.classList.remove('show');
            camera.fov += (60 - camera.fov) * 0.1; // 通常視野角へ戻す
        }
        camera.updateProjectionMatrix();


        // --- ベクトル移動計算 ---
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir); dir.y = 0; dir.normalize(); 
        const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();

        let isMoving = false;
        const dist = currentSpeed * delta;

        // 前進・後退
        if (isFwd) { camera.position.addScaledVector(dir, dist); isMoving = true; }
        if (keys.s || mobileDir.fwd === -1) { camera.position.addScaledVector(dir, -dist); isMoving = true; }
        // 左右カニ歩き
        if (keys.a || mobileDir.right === -1) { camera.position.addScaledVector(right, -dist); isMoving = true; }
        if (keys.d || mobileDir.right === 1) { camera.position.addScaledVector(right, dist); isMoving = true; } 

        // 壁の衝突判定 (可変道幅に対応)
        const limitX = streetWidth / 2 - 2;
        camera.position.x = Math.max(-limitX, Math.min(limitX, camera.position.x));
        camera.position.z = Math.min(10, camera.position.z);

        // マイクラ風ヘッドボブ（歩行時の上下揺れ）
        if (isMoving) {
            const bobSpeed = isSprinting ? 18 : 12; // ダッシュ時は揺れを早く
            headBobTimer += delta * bobSpeed; 
            camera.position.y = 4 + Math.sin(headBobTimer) * 0.12;
        } else {
            camera.position.y += (4 - camera.position.y) * 0.1;
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