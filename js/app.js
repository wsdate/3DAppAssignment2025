let scene, camera, renderer, currentModel, controls;
let currentModelIndex = -1;
let isRotating = true;
let isWireframe = false;
let isAnimating = false;
let light;
let originalMaterials = new Map();
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, wireframe: true });
const ANIMATION_DURATION = 600;

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

    loadGLTFModel(0);
}

function loadGLTFModel(index, direction = 'none') {
    if (isAnimating || index === currentModelIndex) return;
    isAnimating = true;

    const calculateMoveDistance = () => {
        const cameraDistance = camera.position.z;
        const aspect = camera.aspect;
        const fovRad = THREE.MathUtils.degToRad(camera.fov);
        const visibleHeight = 2 * Math.tan(fovRad / 2) * cameraDistance;
        return visibleHeight * aspect;
    };
    let moveDistance = calculateMoveDistance() / 1.5;
    moveDistance = moveDistance < 3 ? 3 : moveDistance;

    const oldModel = currentModel;
    const targetIndex = (index + models.length) % models.length;
    const directionFactor = direction === 'next' ? 1 : -1;

    // Load new model
    new THREE.GLTFLoader().load(
        models[targetIndex],
        (gltf) => {
            const newModel = gltf.scene;
            prepareModel(newModel);

            // Set Initial Position
            if (oldModel) {
                newModel.position.x = directionFactor * moveDistance;
            }
            newModel.position.y = 0;
            newModel.position.z = 0;
            scene.add(newModel);

            // Start animation
            const startTime = Date.now();
            const animateTransition = () => {
                const progress = Math.min(1, (Date.now() - startTime) / ANIMATION_DURATION);
                
                if (oldModel) {
                    oldModel.position.x = -directionFactor * moveDistance * progress;
                    oldModel.rotation.y = -progress * Math.PI/2;
                }
                
                newModel.position.x = directionFactor * moveDistance * (1 - progress);
                newModel.rotation.y = directionFactor * Math.PI/2 * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(animateTransition);
                } else {
                    // Animation completed
                    if (oldModel) scene.remove(oldModel);
                    currentModel = newModel;
                    currentModelIndex = targetIndex;
                    isAnimating = false;
                }
            };

            animateTransition();
        },
        undefined,
        (err) => console.error('Error loading model:', err)
    );
}

function prepareModel(model) {
    model.scale.set(1.5, 1.5, 1.5);
    centerModel(model);

    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                map: child.material.map,
                metalness: 0.3,
                roughness: child.material.roughness
            });
            if (isWireframe) {
                originalMaterials.set(child, child.material);
                child.material = wireframeMaterial;
            }
        }
    });
}

function centerModel(model) {
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
    if (isRotating && currentModel) {
        currentModel.rotation.x += 0.01;
        currentModel.rotation.z += 0.012;
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
    if (currentModel) {
        currentModel.traverse(child => {
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
}

function toggleLight() {
    light.visible = !light.visible;
    document.querySelector('.control-btn:nth-child(3) i').className = light.visible ? 'fas fa-lightbulb' : 'fas fa-times-circle';
}

function nextModel() {
    if (isAnimating) return;
    const newIndex = (currentModelIndex + 1) % models.length;
    loadGLTFModel(newIndex, 'next')
}

function prevModel() {
    if (isAnimating) return;
    const newIndex = (currentModelIndex - 1 + models.length) % models.length;
    loadGLTFModel(newIndex, 'prev');
}

function toggleModel(index) {
    if (currentModelIndex > index) {
        loadGLTFModel(index, 'prev');
    } else {
        loadGLTFModel(index, 'next');
    }
}

// Initialize application
init();
animate();