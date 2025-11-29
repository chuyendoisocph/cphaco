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

// Fullscreen elements
const viewerShell = document.getElementById('viewerCanvasShell');
const btnFullscreen = document.getElementById('btnFullscreen');

const btnViewEls = Array.from(document.querySelectorAll('.btn-view'));
const btnPartsAll = document.getElementById('btnPartsAll');
const btnPartsNone = document.getElementById('btnPartsNone');

// New feature elements
const environmentSelect = document.getElementById('environmentSelect');
const btnScreenshot = document.getElementById('btnScreenshot');
const btnModelInfo = document.getElementById('btnModelInfo');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const modelInfoModal = document.getElementById('modelInfoModal');
const closeModalBtn = document.getElementById('closeModalBtn');

let lastFpsUpdate = 0;
let frameCount = 0;
let currentModelFileName = 'Unknown';

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

  // GROUND
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.9,
    metalness: 0.0
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);
  ground.visible = false;

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

  // Setup new feature listeners
  if (environmentSelect) {
    environmentSelect.addEventListener('change', (e) => switchEnvironment(e.target.value));
  }
  
  if (btnScreenshot) {
    btnScreenshot.addEventListener('click', captureScreenshot);
  }
  
  if (btnModelInfo) {
    btnModelInfo.addEventListener('click', showModelInfo);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modelInfoModal.style.display = 'none';
    });
  }
  
  if (modelInfoModal) {
    modelInfoModal.addEventListener('click', (e) => {
      if (e.target === modelInfoModal) {
        modelInfoModal.style.display = 'none';
      }
    });
  }
  
  // Setup file upload
  if (uploadZone) {
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    });
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
  }

  // 🔥 IMPROVED: Fullscreen với hỗ trợ mobile tốt hơn
  if (viewerShell && btnFullscreen) {
    // Sử dụng touchend cho mobile, click cho desktop
    btnFullscreen.addEventListener('click', handleFullscreenToggle);
    btnFullscreen.addEventListener('touchend', (e) => {
      e.preventDefault(); // Ngăn double-tap zoom trên iOS
      handleFullscreenToggle();
    });

    // Lắng nghe tất cả các sự kiện fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    // Thêm orientation change cho mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeRendererToDisplaySize, 100);
    });

    // Position the fullscreen button (it lives outside the viewer shell now)
    window.addEventListener('resize', () => {
      // Resize handling if needed later
    });
  }
}

function positionFullscreenButton() {
  // No longer needed - button stays in shell with CSS positioning
}

function setupHDRI() {
  const loader = new HDRLoader();

  loader.load('assets/hdr/studio_small_08_1k.hdr', (hdr) => {
    if (!hdr || !hdr.data || !hdr.width || !hdr.height) {
      console.error('[HDR] Dữ liệu HDR rỗng hoặc không hợp lệ:', hdr);
      return;
    }

    const texture = new THREE.DataTexture(
      hdr.data,
      hdr.width,
      hdr.height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const envMap = pmrem.fromEquirectangular(texture).texture;

    scene.environment = envMap;
    scene.background = new THREE.Color(0xf5f7fb);

    texture.dispose();
    pmrem.dispose();
  });
}

function resizeRendererToDisplaySize() {
  if (!renderer || !camera) return;

  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height || 1;
    camera.updateProjectionMatrix();
  }
}

// EnvMap HDR
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

// 🔥 IMPROVED: Fullscreen functions với hỗ trợ mobile tốt hơn

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isViewerFullscreen() {
  return !!(
    document.fullscreenElement === viewerShell ||
    document.webkitFullscreenElement === viewerShell ||
    document.mozFullScreenElement === viewerShell ||
    document.msFullscreenElement === viewerShell
  );
}

function enterFakeFullscreen() {
  // Fake fullscreen cho iOS Safari
  viewerShell.classList.add('fake-fullscreen');
  btnFullscreen.classList.add('is-fullscreen');
  document.body.style.overflow = 'hidden';
  
  // Scroll to top và ẩn address bar
  window.scrollTo(0, 1);
  
  // Lock orientation nếu được hỗ trợ
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
  
  resizeRendererToDisplaySize();
}

function exitFakeFullscreen() {
  viewerShell.classList.remove('fake-fullscreen');
  btnFullscreen.classList.remove('is-fullscreen');
  document.body.style.overflow = '';
  
  // Unlock orientation
  if (screen.orientation && screen.orientation.unlock) {
    screen.orientation.unlock();
  }
  
  resizeRendererToDisplaySize();
}

function handleFullscreenToggle() {
  if (!viewerShell) {
    console.error('viewerShell không tồn tại');
    return;
  }

  // Nếu là iOS Safari, dùng fake fullscreen
  if (isIOS() && !document.fullscreenEnabled) {
    if (viewerShell.classList.contains('fake-fullscreen')) {
      exitFakeFullscreen();
    } else {
      enterFakeFullscreen();
    }
    return;
  }

  try {
    if (!isViewerFullscreen()) {
      // Vào fullscreen - thử tất cả các phương thức
      const requestFullscreen = 
        viewerShell.requestFullscreen ||
        viewerShell.webkitRequestFullscreen ||
        viewerShell.webkitEnterFullscreen ||
        viewerShell.mozRequestFullScreen ||
        viewerShell.msRequestFullscreen;

      if (requestFullscreen) {
        const promise = requestFullscreen.call(viewerShell);
        
        if (promise && promise.catch) {
          promise.catch(err => {
            console.log('Fullscreen bị chặn, dùng fake fullscreen:', err);
            // Fallback sang fake fullscreen nếu bị chặn
            enterFakeFullscreen();
          });
        }
      } else {
        console.log('Trình duyệt không hỗ trợ Fullscreen API, dùng fake fullscreen');
        enterFakeFullscreen();
      }
    } else {
      // Thoát fullscreen
      const exitFullscreen = 
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.webkitCancelFullScreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;

      if (exitFullscreen) {
        exitFullscreen.call(document).catch(err => {
          console.error('Lỗi khi thoát fullscreen:', err);
        });
      }
    }
  } catch (error) {
    console.error('Lỗi fullscreen:', error);
    // Fallback sang fake fullscreen
    if (viewerShell.classList.contains('fake-fullscreen')) {
      exitFakeFullscreen();
    } else {
      enterFakeFullscreen();
    }
  }
}

function handleFullscreenChange() {
  if (!btnFullscreen) return;

  const isFullscreen = isViewerFullscreen();
  
  if (isFullscreen) {
    btnFullscreen.classList.add('is-fullscreen');
    // Lock orientation to landscape on mobile if supported
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(err => {
        console.log('Không thể khóa orientation:', err);
      });
    }
  } else {
    btnFullscreen.classList.remove('is-fullscreen');
    // Unlock orientation when exiting fullscreen
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    }
  }

  // Cập nhật lại size/camera khi vào/thoát fullscreen
  setTimeout(() => {
    resizeRendererToDisplaySize();
  }, 100);
}

function loadModel(url) {
  showLoading(true);
  clearCurrentModel();

  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      currentModel = gltf.scene;

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

  model.position.x += -center.x;
  model.position.y += -center.y;
  model.position.z += -center.z;

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 2.2 / maxDim;
  model.scale.setScalar(scale);

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

// ========== NEW FEATURES ==========

function switchEnvironment(envType) {
  // Switch between different lighting setups
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  let hdrFile = 'assets/hdr/lilienstein_4k.hdr'; // default
  
  if (envType === 'studio') {
    hdrFile = 'assets/hdr/studio_small_08_1k.hdr';
  } else if (envType === 'outdoor') {
    hdrFile = 'assets/hdr/lilienstein_4k.hdr';
  } else if (envType === 'neutral') {
    // Neutral environment - simple color
    const color = new THREE.Color(0xffffff);
    scene.background = color;
    scene.environment = null;
    return;
  }

  const loader = new HDRLoader();
  loader.load(hdrFile, (hdrData) => {
    const texture = new THREE.DataTexture(
      hdrData.data,
      hdrData.width,
      hdrData.height,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    scene.background = new THREE.Color(0xf5f7fb);
    texture.dispose();
  });
}

function captureScreenshot() {
  // Capture current viewport as image
  if (!renderer) return;
  
  renderer.render(scene, camera);
  const canvas = renderer.domElement;
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.href = url;
    link.download = `screenshot-${timestamp}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function showModelInfo() {
  if (!currentModel) {
    alert('Chưa tải model nào');
    return;
  }

  const box = new THREE.Box3().setFromObject(currentModel);
  const size = box.getSize(new THREE.Vector3());
  
  let polygons = 0;
  let materials = new Set();
  
  currentModel.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry.index) {
        polygons += child.geometry.index.count / 3;
      } else if (child.geometry.attributes && child.geometry.attributes.position) {
        polygons += child.geometry.attributes.position.count / 3;
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => materials.add(m.name || 'Material'));
        } else {
          materials.add(child.material.name || 'Material');
        }
      }
    }
  });

  document.getElementById('infoFileName').textContent = currentModelFileName;
  document.getElementById('infoFileSize').textContent = '—';
  document.getElementById('infoPolygons').textContent = Math.round(polygons).toLocaleString('vi-VN');
  document.getElementById('infoMaterials').textContent = materials.size || '—';
  document.getElementById('infoDimensions').textContent = 
    `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`;

  modelInfoModal.style.display = 'flex';
}

function handleFileUpload(file) {
  if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
    alert('Chỉ hỗ trợ file .glb hoặc .gltf');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const arrayBuffer = e.target.result;
    loadModelFromArrayBuffer(arrayBuffer, file.name);
  };
  reader.readAsArrayBuffer(file);
}

function loadModelFromArrayBuffer(arrayBuffer, fileName) {
  showLoading(true);
  clearCurrentModel();
  currentModelFileName = fileName;

  const loader = new GLTFLoader();
  const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);

  loader.load(
    url,
    (gltf) => {
      currentModel = gltf.scene;

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
      URL.revokeObjectURL(url);
    },
    undefined,
    (error) => {
      console.error('Error loading custom model', error);
      showLoading(false);
      alert('Không tải được model. Kiểm tra file .glb/.gltf');
      URL.revokeObjectURL(url);
    }
  );
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