import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';
import { RGBELoader } from './libs/RGBELoader.js';
import { HDRLoader } from './libs/HDRLoader.js';


let scene, camera, renderer, controls;
let currentModel = null;
let mixers = [];
const clock = new THREE.Clock();

const partsContainer = document.getElementById('partsContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const fpsLabel = document.getElementById('fpsLabel');
const polyLabel = document.getElementById('polyLabel');
const centerLabel = document.getElementById('centerLabel');

const btnViewEls = Array.from(document.querySelectorAll('.btn-view'));
const btnPartsAll = document.getElementById('btnPartsAll');
const btnPartsNone = document.getElementById('btnPartsNone');

let lastFpsUpdate = 0;
let frameCount = 0;

init();
animate();
loadModel(document.getElementById('productSelect').value);

function init() {
  const canvas = document.getElementById('viewer');

  // SCENE
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f7fb);

  // CAMERA
  camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
  );
  camera.position.set(2, 2, 4);

  // RENDERER
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  resizeRendererToDisplaySize();

  // 🔥 Bật pipeline “đẹp hơn”
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // LIGHTS
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111827, 0.7);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
  dirLight.position.set(6, 10, 4);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 40;
  dirLight.shadow.camera.left = -15;
  dirLight.shadow.camera.right = 15;
  dirLight.shadow.camera.top = 15;
  dirLight.shadow.camera.bottom = -15;
  dirLight.shadow.bias = -0.001;
  scene.add(dirLight);

  // GROUND (nhận bóng) – giữ grid nếu bạn thích
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.9,
    metalness: 0.0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0; // model sau normalize sẽ nằm quanh 0
  ground.receiveShadow = true;
  scene.add(ground);
  ground.visible = false;

  // Nếu vẫn muốn grid phụ:
  // const grid = new THREE.GridHelper(12, 24, 0x9ca3af, 0xd1d5db);
  // grid.position.y = 0.001;
  // scene.add(grid);

  // CONTROLS
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.5, 0);

  // EVENTS
  window.addEventListener('resize', resizeRendererToDisplaySize);

  document.getElementById('productSelect').addEventListener('change', (e) => {
    loadModel(e.target.value);
  });

  btnViewEls.forEach(btn => {
    btn.addEventListener('click', () => {
      btnViewEls.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      setView(btn.dataset.view);
    });
  });

  if (btnPartsAll && btnPartsNone) {
    btnPartsAll.addEventListener('click', () => toggleAllParts(true));
    btnPartsNone.addEventListener('click', () => toggleAllParts(false));
  }
}

function setupHDRI() {
  const loader = new HDRLoader();

  loader.load('assets/hdr/studio_small_08_1k.hdr', (hdr) => {
    // hdr = { data: Float32Array, width, height }
    if (!hdr || !hdr.data || !hdr.width || !hdr.height) {
      console.error('[HDR] Dữ liệu HDR rỗng hoặc không hợp lệ:', hdr);
      return;
    }

    // Tạo DataTexture từ buffer HDR
    const texture = new THREE.DataTexture(
      hdr.data,
      hdr.width,
      hdr.height,
      THREE.RGBAFormat,      // HDRLoader trả RGBA float
      THREE.FloatType
    );
    texture.needsUpdate = true;

    // Tạo envMap từ equirect
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    // LƯU Ý: dùng fromEquirectangular thay vì fromEquirectangularTexture
    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.environment = envMap;                 // cho PBR phản xạ
    scene.background  = new THREE.Color(0xf5f7fb); // nền UI phẳng sáng

    // dọn tài nguyên
    texture.dispose();
    pmrem.dispose();
  });
}

function resizeRendererToDisplaySize() {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const loader = new HDRLoader();

loader.load('assets/hdr/lilienstein_4k.hdr', (hdrData) => {
    const texture = new THREE.DataTexture(
        hdrData.data,
        hdrData.width,
        hdrData.height,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    texture.needsUpdate = true;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = new THREE.Color(0xf5f7fb);

    texture.dispose();
    pmremGenerator.dispose();
});



function loadModel(url) {
  showLoading(true);
  clearCurrentModel();

  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      currentModel = gltf.scene;

      // Cho toàn bộ mesh cast / receive shadow + double side
      currentModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.side = THREE.DoubleSide;
            child.material.needsUpdate = true;
          }
        }
      });

      scene.add(currentModel);

      normalizeAndFrameModel(currentModel);
      buildPartsList(currentModel);
      updatePolyCount(currentModel);

      showLoading(false);
    },
    undefined,
    (error) => {
      console.error('Error loading model', error);
      showLoading(false);
      alert('Không tải được model 3D. Kiểm tra đường dẫn / format (.glb).');
    }
  );
}

function clearCurrentModel() {
  if (!currentModel) return;
  scene.remove(currentModel);
  currentModel.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose && m.dispose());
      } else if (child.material.dispose) {
        child.material.dispose();
      }
    }
  });
  currentModel = null;
  partsContainer.innerHTML = '';
  polyLabel.textContent = '—';
  centerLabel.textContent = '—';
}

function normalizeAndFrameModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Đưa model về tâm
  model.position.x += -center.x;
  model.position.y += -center.y;
  model.position.z += -center.z;

  // Scale vừa khung
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 2.2 / maxDim;
  model.scale.setScalar(scale);

  // Tính lại box sau khi dịch & scale
  const box2 = new THREE.Box3().setFromObject(model);
  const size2 = box2.getSize(new THREE.Vector3());
  const center2 = box2.getCenter(new THREE.Vector3());

  const fov = camera.fov * (Math.PI / 180);
  let distance = (Math.max(size2.x, size2.y, size2.z) / 2) / Math.tan(fov / 2);
  distance *= 1.6;

  const dir = new THREE.Vector3(1, 1, 1).normalize();
  const newPos = center2.clone().add(dir.multiplyScalar(distance));

  camera.position.copy(newPos);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.target.copy(center2);
  controls.update();

  centerLabel.textContent =
    `${center2.x.toFixed(2)}, ${center2.y.toFixed(2)}, ${center2.z.toFixed(2)}`;
}

function buildPartsList(model) {
  partsContainer.innerHTML = '';

  const nodes = [];
  model.traverse((child) => {
    if (child.isMesh) {
      const name = child.name || child.parent?.name || 'Phần không tên';
      nodes.push({ node: child, name });
    }
  });

  const grouped = {};
  nodes.forEach(({ node, name }) => {
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(node);
  });

  Object.entries(grouped).forEach(([name, meshes]) => {
    const item = document.createElement('div');
    item.className = 'part-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;

    checkbox.addEventListener('change', () => {
      meshes.forEach(m => m.visible = checkbox.checked);
    });

    const label = document.createElement('span');
    label.textContent = name;

    item.appendChild(checkbox);
    item.appendChild(label);
    partsContainer.appendChild(item);
  });
}

function toggleAllParts(visible) {
  if (!currentModel) return;
  currentModel.traverse((child) => {
    if (child.isMesh) {
      child.visible = visible;
    }
  });

  Array.from(partsContainer.querySelectorAll('input[type="checkbox"]'))
    .forEach(cb => { cb.checked = visible; });
}

function setView(view) {
  if (!currentModel) return;

  const box = new THREE.Box3().setFromObject(currentModel);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const dist = size.length() * 0.7 || 4;
  const d = dist;

  if (view === 'front') {
    camera.position.set(center.x, center.y + d * 0.1, center.z + d);
  } else if (view === 'top') {
    camera.position.set(center.x, center.y + d, center.z + 0.01);
  } else if (view === 'iso') {
    camera.position.set(center.x + d, center.y + d, center.z + d);
  }

  controls.target.copy(center);
  controls.update();
}

function updatePolyCount(model) {
  let count = 0;
  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geom = child.geometry;
      if (geom.index) {
        count += geom.index.count / 3;
      } else if (geom.attributes && geom.attributes.position) {
        count += geom.attributes.position.count / 3;
      }
    }
  });
  polyLabel.textContent = count ? count.toLocaleString('vi-VN') : '—';
}

function showLoading(show) {
  loadingOverlay.style.display = show ? 'flex' : 'none';
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  mixers.forEach(m => m.update(delta));

  controls.update();
  renderer.render(scene, camera);

  const now = performance.now();
  frameCount++;
  if (now - lastFpsUpdate > 500) {
    const fps = (frameCount * 1000) / (now - lastFpsUpdate);
    fpsLabel.textContent = Math.round(fps).toString();
    frameCount = 0;
    lastFpsUpdate = now;
  }
}
