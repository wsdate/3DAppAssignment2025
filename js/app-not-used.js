let scene, camera, renderer, model, controls;
let currentModelIndex = 0;
let isRotating = true;
let isWireframe = false;
let light;
let originalMaterials = new Map();
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });

const models = [
    'models/cola1.glb',
    'models/cola2.glb',
    'models/cola3.glb'
];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight - 60);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    light = new THREE.PointLight(0xffffff, 1.2, 50);
    light.position.set(5, 8, 5);
    scene.add(light);

    camera.position.z = 6;
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.addEventListener('start', function() {
        isRotating = false;
        document.querySelector('.control-btn:nth-child(1) i').className = isRotating ? 'fas fa-sync' : 'fas fa-lock';
    });

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.querySelector('.left-btn').addEventListener('click', prevModel);
    document.querySelector('.right-btn').addEventListener('click', nextModel);

    loadModel(currentModelIndex);
}

function loadModel(index) {
    if (model) {
        scene.remove(model);
        model = null;
    }

    const gblModle = models[index];
    loadGLTFModel(gblModle);
}

function loadGLTFModel(gblModle) {
    new THREE.GLTFLoader().load(
        gblModle,
        (gltf) => {
            model = gltf.scene;
            model.scale.set(1.5, 1.5, 1.5);
            scene.add(model);
            centerModel();

            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        map: child.material.map,
                        metalness: 0.3,
                        roughness: child.material.roughness
                    });
                }
            });

            model.traverse(child => {
                if (child.isMesh) {
                    if (isWireframe) {
                        originalMaterials.set(child, child.material);
                        child.material = wireframeMaterial;
                    } else {
                        const originalMaterial = originalMaterials.get(child);
                        if (originalMaterial) child.material = originalMaterial;
                    }
                }
            });
        },
        undefined,
        (err) => console.error('Error loading GLTF:', err)
    );
}

function centerModel() {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - 60);
}

function animate() {
    requestAnimationFrame(animate);
    if (isRotating && model) {
        model.rotation.x += 0.01;
        model.rotation.z += 0.012;
    }
    controls.update();
    renderer.render(scene, camera);
}

function toggleRotation() {
    isRotating = !isRotating;
    document.querySelector('.control-btn:nth-child(1) i').className = isRotating ? 'fas fa-sync' : 'fas fa-lock';
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    document.querySelector('.control-btn:nth-child(2) i').className = isWireframe ? 'fas fa-draw-polygon' : 'fas fa-image';
    model.traverse(child => {
        if (child.isMesh) {
            if (isWireframe) {
                originalMaterials.set(child, child.material);
                child.material = wireframeMaterial;
            } else {
                const originalMaterial = originalMaterials.get(child);
                if (originalMaterial) child.material = originalMaterial;
            }
        }
    });
}

function toggleLight() {
    light.visible = !light.visible;
    document.querySelector('.control-btn:nth-child(3) i').className = light.visible ? 'fas fa-lightbulb' : 'fas fa-times-circle';
}

function nextModel() {
    currentModelIndex = (currentModelIndex + 1) % models.length;
    loadModel(currentModelIndex);
}

function prevModel() {
    currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
    loadModel(currentModelIndex);
}

function toggleModel(index) {
    loadModel(index);
}

// Initialize application
init();
animate();