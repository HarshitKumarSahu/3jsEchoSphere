// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import * as dat from 'dat.gui';

// import vertex from './shaders/vertex.glsl';
// import fragment from './shaders/fragment.glsl';

// class RAF {
//   constructor() {
//     this.callbacks = [];
//     this.render = this.render.bind(this);
//     this.render();
//   }

//   subscribe(name, callback) {
//     this.callbacks.push({ name, callback });
//   }

//   unsubscribe(name) {
//     this.callbacks = this.callbacks.filter(item => item.name !== name);
//   }

//   render() {
//     requestAnimationFrame(this.render);
//     this.callbacks.forEach(item => item.callback());
//   }
// }

// class LoadingController {
//   constructor() {
//     this.manager = new THREE.LoadingManager();
//     this.manager.onProgress = (url, loaded, total) => {
//       if (this.onProgress) this.onProgress(url, loaded, total);
//     };
//     this.manager.onLoad = () => {
//       if (this.onLoad) this.onLoad();
//     };
//   }
// }

// class SoundReactor {
//   constructor(audioUrl) {
//     this.url = audioUrl;
//     this.playFlag = false;
//     this.bind();
//   }

//   init() {
//     this.ctx = new AudioContext();
//     this.audio = new Audio(this.url);
//     this.audioSource = this.ctx.createMediaElementSource(this.audio);
//     this.analyser = this.ctx.createAnalyser();
//     this.analyser.smoothingTimeConstant = 0.8;
//     this.audioSource.connect(this.analyser);
//     this.audioSource.connect(this.ctx.destination);
//     this.fdata = new Uint8Array(this.analyser.frequencyBinCount);
//     this.audio.currentTime = 1;
//   }

//   play() {
//     this.audio.play();
//     this.playFlag = true;
//     raf.subscribe('audioReactorUpdate', this.update.bind(this));
//   }

//   pause() {
//     this.audio.pause();
//     this.playFlag = false;
//     raf.unsubscribe('audioReactorUpdate');
//   }

//   update() {
//     this.analyser.getByteFrequencyData(this.fdata);
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//     this.play = this.play.bind(this);
//     this.pause = this.pause.bind(this);
//   }
// }

// class CamParallax {
//   constructor() {
//     this.active = true;
//     this.mousePos = { x: 0, y: 0 };
//     this.params = {
//       intensity: 0.008,
//       ease: 0.08,
//     };
//     this.bind();
//   }

//   init(camera) {
//     this.camera = camera;
//     this.initZ = this.camera.position.z;
//     window.addEventListener('mousemove', this.onMouseMove);
//   }

//   onMouseMove(e) {
//     this.mousePos.x = (e.clientX - window.innerWidth / 2) * this.params.intensity;
//     this.mousePos.y = (e.clientY - window.innerHeight / 2) * this.params.intensity;
//     const yLimit = -3.4;
//     if (this.mousePos.y < yLimit) this.mousePos.y = yLimit;
//   }

//   update() {
//     if (!this.active) return;
//     this.camera.position.x += (this.mousePos.x - this.camera.position.x) * this.params.ease;
//     this.camera.position.y += (this.mousePos.y - this.camera.position.y) * this.params.ease;
//     this.camera.position.z += (this.initZ - this.camera.position.z) * this.params.ease;
//     this.camera.lookAt(0, 0, 0);
//   }

//   bind() {
//     this.onMouseMove = this.onMouseMove.bind(this);
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class ParticleSystem {
//   constructor() {
//     this.particleCount = 5000;
//     this.boxSize = 30;
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.particlesGeom = new THREE.BufferGeometry();
//     this.particlesPos = [];

//     for (let p = 0; p < this.particleCount; p++) {
//       let x = Math.random() * this.boxSize - this.boxSize / 2;
//       let y = Math.random() * this.boxSize - this.boxSize / 2;
//       let z = Math.random() * this.boxSize - this.boxSize / 2;
//       this.particlesPos.push(x, y, z);
//     }

//     this.particlesGeom.setAttribute('position', new THREE.Float32BufferAttribute(this.particlesPos, 3));
//     this.particleMaterial = new THREE.PointsMaterial({
//       color: 0xffffff,
//       size: 0.02,
//     });
//     this.particleSystem = new THREE.Points(this.particlesGeom, this.particleMaterial);
//     this.scene.add(this.particleSystem);
//   }

//   update() {
//     let i = 0;
//     while (i < this.particleCount) {
//       this.particlesGeom.attributes.position.array[i * 3 + 1] += 0.01;
//       if (this.particlesGeom.attributes.position.array[i * 3 + 1] > this.boxSize / 2) {
//         this.particlesGeom.attributes.position.array[i * 3 + 1] = -this.boxSize / 2;
//       }
//       i++;
//     }
//     this.particlesGeom.attributes.position.needsUpdate = true;
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class Floor {
//   constructor() {
//     this.modelLoader = new GLTFLoader(loadingController.manager);
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.modelLoader.load('/models/floorModel.glb', (glb) => {
//       glb.scene.traverse(child => {
//         if (child instanceof THREE.Mesh) {
//           this.floor = child;
//         }
//       });
//       this.floor.translateY(-4);
//       this.floor.scale.multiplyScalar(1.525);
//       this.scene.add(this.floor);
//     });
//   }

//   update() {}

//   bind() {
//     this.init = this.init.bind(this);
//   }
// }

// class SpherePillerClass {
//   constructor() {
//     this.modelLoader = new GLTFLoader(loadingController.manager);
//     this.texLoader = new THREE.TextureLoader(loadingController.manager);
//     this.params = {
//       waveSpeed: 1,
//       subDiv: 3,
//       pillardSize: 0.2,
//     };
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.upVec = new THREE.Vector3(0, 1, 0);
//     this.pillards = new THREE.Group();

//     const gTex = this.texLoader.load('/textures/greyMetel.png');
//     const bTex = this.texLoader.load('/textures/blackMetel.png');
//     this.gMatCap = new THREE.MeshMatcapMaterial({ matcap: gTex });
//     this.bMatCap = new THREE.MeshMatcapMaterial({ matcap: bTex });

//     this.modelLoader.load('/models/pillarsModels.glb', (glb) => {
//       glb.scene.traverse(child => {
//         if (child.name === "base") {
//           this.pillard = child;
//           child.material = this.bMatCap;
//         }
//         if (child.name === "Cylinder") {
//           child.material = this.gMatCap;
//         }
//       });
//       this.computePositions();
//     });

//     const sphereFolder = gui.addFolder('Sphere Pillards');
//     sphereFolder.open();
//     sphereFolder.add(this.params, 'waveSpeed', 0.001, 3).name('Wave Speed');
//     sphereFolder.add(this.params, 'subDiv', 1, 5).step(1).name('Ico Subdivisions').onChange(() => this.computePositions());
//     sphereFolder.add(this.params, 'pillardSize', 0.01, 1).name('Pill Size').onChange(() => this.computePositions());
//   }

//   computePositions() {
//     let ico;
//     this.scene.traverse(child => {
//       if (child.name === 'ico') ico = child;
//     });
//     if (ico) this.scene.remove(ico);

//     const sphereGeom = new THREE.IcosahedronGeometry(2, this.params.subDiv);
//     const sphere = new THREE.Mesh(sphereGeom, this.gMatCap);
//     sphere.name = 'ico';
//     this.scene.add(sphere);

//     this.pillards.clear();
//     let verArray = [];
//     for (let i = 0; i < sphereGeom.attributes.position.array.length; i += 3) {
//       const x = sphereGeom.attributes.position.array[i];
//       const y = sphereGeom.attributes.position.array[i + 1];
//       const z = sphereGeom.attributes.position.array[i + 2];
//       verArray.push({ x, y, z });
//     }

//     let pillPos = [];
//     for (let i = 0; i < verArray.length; i++) {
//       let existsFlag = false;
//       for (let j = 0; j < pillPos.length; j++) {
//         if (pillPos[j].x === verArray[i].x && pillPos[j].y === verArray[i].y && pillPos[j].z === verArray[i].z) {
//           existsFlag = true;
//         }
//       }
//       if (!existsFlag) {
//         pillPos.push({ x: verArray[i].x, y: verArray[i].y, z: verArray[i].z });
//         const c = this.pillard.clone();
//         const posVec = new THREE.Vector3(verArray[i].x, verArray[i].y, verArray[i].z);
//         c.position.copy(posVec);
//         c.scale.multiplyScalar(this.params.pillardSize);
//         c.quaternion.setFromUnitVectors(this.upVec, posVec.normalize());
//         this.pillards.add(c);
//       }
//     }
//     this.scene.add(this.pillards);
//   }

//   update() {
//     if (soundReactor.playFlag) {
//       let i = 0;
//       while (i < this.pillards.children.length) {
//         this.pillards.children[i].children[0].position.y = soundReactor.fdata[i] / 255 * 4;
//         i++;
//       }
//     } else {
//       let i = 0;
//       while (i < this.pillards.children.length) {
//         this.pillards.children[i].children[0].position.y = (Math.sin(Date.now() * 0.01 * this.params.waveSpeed + this.pillards.children[i].position.x) + 1) * 1.5;
//         i++;
//       }
//     }
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.computePositions = this.computePositions.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class Spectrum {
//   constructor() {
//     this.modelLoader = new GLTFLoader(loadingController.manager);
//     this.textureLoader = new THREE.TextureLoader(loadingController.manager);
//     this.bind();
//   }

//   async init(scene) {
//     this.scene = scene;
//     this.uniforms = {
//       uMatCap: { value: this.textureLoader.load('/textures/blackMetel.png') },
//       uSpecterSize: { value: 0.8 },
//       uWaveBorder: { value: 0.3 },
//       uWaveSpeed: { value: 0.1 },
//       uBorderColor: { value: new THREE.Color("hsl(287, 80%, 80%)") },
//       uTime: { value: 0 },
//     };

//     const vertexShader = await fetch('/shaders/vertex.glsl').then(res => res.text());
//     const fragmentShader = await fetch('/shaders/fragment.glsl').then(res => res.text());

//     this.shaderMat = new THREE.ShaderMaterial({
//       fragmentShader: fragment,
//       vertexShader: vertex,
//       uniforms: this.uniforms,
//       transparent: true,
//     });

//     this.modelLoader.load('/models/spectrum.glb', (glb) => {
//       glb.scene.traverse(child => {
//         if (child instanceof THREE.Mesh) {
//           child.material = this.shaderMat;
//           child.scale.multiplyScalar(2);
//           child.position.y = -1.2;
//         }
//       });
//       this.scene.add(glb.scene);
//     });

//     const shaderFolder = gui.addFolder("Spectrum Folder");
//     shaderFolder.open();
//     shaderFolder.add(this.uniforms.uSpecterSize, "value", -1, 1).name('Spectrum Size');
//     shaderFolder.add(this.uniforms.uWaveBorder, "value", 0, 1).name('Border Size');
//     shaderFolder.add(this.uniforms.uWaveSpeed, "value", 0, 1).name('Wave speed');
//   }

//   update() {
//     this.uniforms.uTime.value += 1;
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class MainThreeScene {
//   constructor() {
//     this.bind();
//   }

//   async init() {
//     this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl'), antialias: true });
//     this.renderer.setSize(window.innerWidth, window.innerHeight);

//     const color = new THREE.Color(0x151515);
//     const fog = new THREE.Fog(color, 15, 30);
//     this.scene = new THREE.Scene();
//     this.scene.fog = fog;
//     this.scene.background = color;

//     this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//     this.camera.position.set(0, 0, 5);
//     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
//     this.controls.enabled = false;
//     this.controls.maxDistance = 40;
//     this.controls.minDistance = 3;
//     this.controls.minPolarAngle = 0;
//     this.controls.maxPolarAngle = Math.PI / 2 + 0.3;

//     camParallax.init(this.camera);

//     const camFolder = gui.addFolder("Camera Folder");
//     camFolder.open();
//     camFolder.add(this.controls, "enabled").onChange(() => {
//       if (this.controls.enabled) camParallax.active = false;
//     }).listen().name('Orbit Controls');
//     camFolder.add(camParallax, "active").onChange(() => {
//       if (camParallax.active) this.controls.enabled = false;
//     }).listen().name('Cam Parallax');
//     camFolder.add(camParallax.params, "intensity", 0.001, 0.01);
//     camFolder.add(camParallax.params, "ease", 0.01, 0.1);

//     spherePillerClass.init(this.scene);
//     floorClass.init(this.scene);
//     await spectrumClass.init(this.scene);
//     particleSystem.init(this.scene);

//     gui.hide();

//     const playPauseButton = document.getElementById('playPauseButton');
//     let initFlag = false;
//     playPauseButton.addEventListener('click', () => {
//       if (!initFlag) {
//         initFlag = true;
//         soundReactor.init();
//       }
//       if (soundReactor.playFlag) {
//         soundReactor.pause();
//         playPauseButton.textContent = 'Play';
//       } else {
//         soundReactor.play();
//         playPauseButton.textContent = 'Pause';
//       }
//     });

//     window.addEventListener("resize", this.resizeCanvas.bind(this));
//     raf.subscribe('threeSceneUpdate', this.update.bind(this));
//   }

//   update() {
//     this.renderer.render(this.scene, this.camera);
//     this.scene.rotateY(0.0015);
//     spherePillerClass.update();
//     spectrumClass.update();
//     particleSystem.update();
//     camParallax.update();
//   }

//   resizeCanvas() {
//     this.renderer.setSize(window.innerWidth, window.innerHeight);
//     this.camera.aspect = window.innerWidth / window.innerHeight;
//     this.camera.updateProjectionMatrix();
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//     this.resizeCanvas = this.resizeCanvas.bind(this);
//   }
// }

// const raf = new RAF();
// const loadingController = new LoadingController();
// const soundReactor = new SoundReactor('/audios/3.mp3');
// const camParallax = new CamParallax();
// const particleSystem = new ParticleSystem();
// const floorClass = new Floor();
// const spherePillerClass = new SpherePillerClass();
// const spectrumClass = new Spectrum();
// const gui = new dat.GUI();

// loadingController.onProgress = (url, loaded, total) => {
//   const progressFill = document.getElementById('progressFill');
//   const progressUrl = document.getElementById('progressUrl');
//   progressUrl.textContent = url;
//   progressFill.style.width = (loaded / total * 100) + '%';
// };

// loadingController.onLoad = () => {
//   const loadingScreen = document.getElementById('loadingScreen');
//   loadingScreen.classList.add('finished');
// };

// const mainScene = new MainThreeScene();
// mainScene.init();











// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import * as dat from 'dat.gui';
// import vertex from './shaders/vertex.glsl';
// import fragment from './shaders/fragment.glsl';

// class RAF {
//   constructor() {
//     this.callbacks = [];
//     this.render = this.render.bind(this);
//     this.render();
//   }

//   subscribe(name, callback) {
//     this.callbacks.push({ name, callback });
//   }

//   unsubscribe(name) {
//     this.callbacks = this.callbacks.filter(item => item.name !== name);
//   }

//   render() {
//     requestAnimationFrame(this.render);
//     this.callbacks.forEach(item => item.callback());
//   }
// }

// class LoadingController {
//   constructor() {
//     this.manager = new THREE.LoadingManager();
//     this.manager.onProgress = (url, loaded, total) => {
//       if (this.onProgress) this.onProgress(url, loaded, total);
//     };
//     this.manager.onLoad = () => {
//       if (this.onLoad) this.onLoad();
//     };
//   }
// }

// class SoundReactor {
//   constructor(audioUrl) {
//     this.url = audioUrl;
//     this.playFlag = false;
//     this.bind();
//   }

//   init() {
//     this.ctx = new AudioContext();
//     this.audio = new Audio(this.url);
//     this.audioSource = this.ctx.createMediaElementSource(this.audio);
//     this.analyser = this.ctx.createAnalyser();
//     this.analyser.smoothingTimeConstant = 0.8;
//     this.audioSource.connect(this.analyser);
//     this.audioSource.connect(this.ctx.destination);
//     this.fdata = new Uint8Array(this.analyser.frequencyBinCount);
//     this.audio.currentTime = 1;
//   }

//   play() {
//     this.audio.play();
//     this.playFlag = true;
//     raf.subscribe('audioReactorUpdate', this.update.bind(this));
//   }

//   pause() {
//     this.audio.pause();
//     this.playFlag = false;
//     raf.unsubscribe('audioReactorUpdate');
//   }

//   update() {
//     this.analyser.getByteFrequencyData(this.fdata);
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//     this.play = this.play.bind(this);
//     this.pause = this.pause.bind(this);
//   }
// }

// class CamParallax {
//   constructor() {
//     this.active = true;
//     this.mousePos = { x: 0, y: 0 };
//     this.params = {
//       intensity: 0.008,
//       ease: 0.08,
//     };
//     this.bind();
//   }

//   init(camera) {
//     this.camera = camera;
//     this.initZ = this.camera.position.z;
//     window.addEventListener('mousemove', this.onMouseMove);
//   }

//   onMouseMove(e) {
//     this.mousePos.x = (e.clientX - window.innerWidth / 2) * this.params.intensity;
//     this.mousePos.y = (e.clientY - window.innerHeight / 2) * this.params.intensity;
//     const yLimit = -3.4;
//     if (this.mousePos.y < yLimit) this.mousePos.y = yLimit;
//   }

//   update() {
//     if (!this.active) return;
//     this.camera.position.x += (this.mousePos.x - this.camera.position.x) * this.params.ease;
//     this.camera.position.y += (this.mousePos.y - this.camera.position.y) * this.params.ease;
//     this.camera.position.z += (this.initZ - this.camera.position.z) * this.params.ease;
//     this.camera.lookAt(0, 0, 0);
//   }

//   bind() {
//     this.onMouseMove = this.onMouseMove.bind(this);
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class ParticleSystem {
//   constructor() {
//     this.particleCount = 5000;
//     this.boxSize = 30;
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.particlesGeom = new THREE.BufferGeometry();
//     this.particlesPos = [];

//     for (let p = 0; p < this.particleCount; p++) {
//       let x = Math.random() * this.boxSize - this.boxSize / 2;
//       let y = Math.random() * this.boxSize - this.boxSize / 2;
//       let z = Math.random() * this.boxSize - this.boxSize / 2;
//       this.particlesPos.push(x, y, z);
//     }

//     this.particlesGeom.setAttribute('position', new THREE.Float32BufferAttribute(this.particlesPos, 3));
//     this.particleMaterial = new THREE.PointsMaterial({
//       color: 0xffffff,
//       size: 0.02,
//     });
//     this.particleSystem = new THREE.Points(this.particlesGeom, this.particleMaterial);
//     this.scene.add(this.particleSystem);
//   }

//   update() {
//     let i = 0;
//     while (i < this.particleCount) {
//       this.particlesGeom.attributes.position.array[i * 3 + 1] += 0.01;
//       if (this.particlesGeom.attributes.position.array[i * 3 + 1] > this.boxSize / 2) {
//         this.particlesGeom.attributes.position.array[i * 3 + 1] = -this.boxSize / 2;
//       }
//       i++;
//     }
//     this.particlesGeom.attributes.position.needsUpdate = true;
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class Floor {
//   constructor() {
//     this.modelLoader = new GLTFLoader(loadingController.manager);
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.modelLoader.load(
//       '/assets/models/floorModel.glb',
//       (glb) => {
//         glb.scene.traverse(child => {
//           if (child instanceof THREE.Mesh) {
//             this.floor = child;
//             //Ensure material is visible
//             if (!child.material) {
//               child.material = new THREE.MeshStandardMaterial({ color: 0x808080 });
//             }
//           }
//         });
//         if (this.floor) {
//           this.floor.position.set(0, -2, 0); // Adjusted to be closer to camera
//           this.floor.scale.multiplyScalar(1.525);
//           this.scene.add(this.floor);
//           console.log('Floor loaded and added to scene:', this.floor);
//         } else {
//           console.warn('No mesh found in floorModel.glb');
//           // Fallback plane
//           const fallbackGeometry = new THREE.PlaneGeometry(20, 20);
//           const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
//           this.floor = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
//           this.floor.rotation.x = -Math.PI / 2;
//           this.floor.position.set(0, -2, 0);
//           this.scene.add(this.floor);
//           console.log('Fallback floor added');
//         }
//       },
//       undefined,
//       (error) => {
//         console.error('Error loading floorModel.glb:', error);
//         // Fallback plane on error
//         const fallbackGeometry = new THREE.PlaneGeometry(20, 20);
//         const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
//         this.floor = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
//         this.floor.rotation.x = -Math.PI / 2;
//         this.floor.position.set(0, -2, 0);
//         this.scene.add(this.floor);
//         console.log('Fallback floor added due to load error');
//       }
//     );
//   }

//   update() {}

//   bind() {
//     this.init = this.init.bind(this);
//   }
// }

// class SpherePillerClass {
//   constructor() {
//     this.modelLoader = new GLTFLoader(loadingController.manager);
//     this.texLoader = new THREE.TextureLoader(loadingController.manager);
//     this.params = {
//       waveSpeed: 1,
//       subDiv: 3,
//       pillardSize: 0.2,
//     };
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.upVec = new THREE.Vector3(0, 1, 0);
//     this.pillards = new THREE.Group();

//     const gTex = this.texLoader.load('/textures/greyMetel.png');
//     const bTex = this.texLoader.load('/textures/blackMetel.png');
//     this.gMatCap = new THREE.MeshMatcapMaterial({ matcap: gTex });
//     this.bMatCap = new THREE.MeshMatcapMaterial({ matcap: bTex });

//     this.modelLoader.load(
//       '/models/pillarsModels.glb',
//       (glb) => {
//         glb.scene.traverse(child => {
//           if (child.name === "base") {
//             this.pillard = child;
//             child.material = this.bMatCap;
//           }
//           if (child.name === "Cylinder") {
//             child.material = this.gMatCap;
//           }
//         });
//         this.computePositions();
//       },
//       undefined,
//       (error) => {
//         console.error('Error loading soundPillardsModels.glb:', error);
//       }
//     );

//     const sphereFolder = gui.addFolder('Sphere Pillards');
//     sphereFolder.open();
//     sphereFolder.add(this.params, 'waveSpeed', 0.001, 3).name('Wave Speed');
//     sphereFolder.add(this.params, 'subDiv', 1, 5).step(1).name('Ico Subdivisions').onChange(() => this.computePositions());
//     sphereFolder.add(this.params, 'pillardSize', 0.01, 1).name('Pill Size').onChange(() => this.computePositions());
//   }

//   computePositions() {
//     let ico;
//     this.scene.traverse(child => {
//       if (child.name === 'ico') ico = child;
//     });
//     if (ico) this.scene.remove(ico);

//     const sphereGeom = new THREE.IcosahedronGeometry(2, this.params.subDiv);
//     const sphere = new THREE.Mesh(sphereGeom, this.gMatCap);
//     sphere.name = 'ico';
//     this.scene.add(sphere);

//     this.pillards.clear();
//     let verArray = [];
//     for (let i = 0; i < sphereGeom.attributes.position.array.length; i += 3) {
//       const x = sphereGeom.attributes.position.array[i];
//       const y = sphereGeom.attributes.position.array[i + 1];
//       const z = sphereGeom.attributes.position.array[i + 2];
//       verArray.push({ x, y, z });
//     }

//     let pillPos = [];
//     for (let i = 0; i < verArray.length; i++) {
//       let existsFlag = false;
//       for (let j = 0; j < pillPos.length; j++) {
//         if (pillPos[j].x === verArray[i].x && pillPos[j].y === verArray[i].y && pillPos[j].z === verArray[i].z) {
//           existsFlag = true;
//         }
//       }
//       if (!existsFlag) {
//         pillPos.push({ x: verArray[i].x, y: verArray[i].y, z: verArray[i].z });
//         const c = this.pillard.clone();
//         const posVec = new THREE.Vector3(verArray[i].x, verArray[i].y, verArray[i].z);
//         c.position.copy(posVec);
//         c.scale.multiplyScalar(this.params.pillardSize);
//         c.quaternion.setFromUnitVectors(this.upVec, posVec.normalize());
//         this.pillards.add(c);
//       }
//     }
//     this.scene.add(this.pillards);
//   }

//   update() {
//     if (soundReactor.playFlag) {
//       let i = 0;
//       while (i < this.pillards.children.length) {
//         this.pillards.children[i].children[0].position.y = soundReactor.fdata[i] / 255 * 4;
//         i++;
//       }
//     } else {
//       let i = 0;
//       while (i < this.pillards.children.length) {
//         this.pillards.children[i].children[0].position.y = (Math.sin(Date.now() * 0.01 * this.params.waveSpeed + this.pillards.children[i].position.x) + 1) * 1.5;
//         i++;
//       }
//     }
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.computePositions = this.computePositions.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class Spectrum {
//   constructor() {
//     this.modelLoader = new GLTFLoader(loadingController.manager);
//     this.textureLoader = new THREE.TextureLoader(loadingController.manager);
//     this.bind();
//   }

//   init(scene) {
//     this.scene = scene;
//     this.uniforms = {
//       uMatCap: { value: this.textureLoader.load('/textures/blackMetel.png') },
//       uSpecterSize: { value: 0.8 },
//       uWaveBorder: { value: 0.3 },
//       uWaveSpeed: { value: 0.1 },
//       uBorderColor: { value: new THREE.Color("hsl(287, 80%, 80%)") },
//       uTime: { value: 0 },
//     };

//     this.shaderMat = new THREE.ShaderMaterial({
//       fragmentShader: fragment,
//       vertexShader: vertex,
//       uniforms: this.uniforms,
//       transparent: true,
//     });

//     this.modelLoader.load(
//       '/models/spectrum.glb',
//       (glb) => {
//         glb.scene.traverse(child => {
//           if (child instanceof THREE.Mesh) {
//             child.material = this.shaderMat;
//             child.scale.multiplyScalar(1.5);
//             child.position.y = -1.2;
//           }
//         });
//         this.scene.add(glb.scene);
//       },
//       undefined,
//       (error) => {
//         console.error('Error loading spectrum.glb:', error);
//       }
//     );

//     const shaderFolder = gui.addFolder("Spectrum Folder");
//     shaderFolder.open();
//     shaderFolder.add(this.uniforms.uSpecterSize, "value", -1, 1).name('Spectrum Size');
//     shaderFolder.add(this.uniforms.uWaveBorder, "value", 0, 1).name('Border Size');
//     shaderFolder.add(this.uniforms.uWaveSpeed, "value", 0, 1).name('Wave speed');
//   }

//   update() {
//     this.uniforms.uTime.value += 1;
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//   }
// }

// class MainThreeScene {
//   constructor() {
//     this.bind();
//   }

//   async init() {
//     this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl'), antialias: true });
//     this.renderer.setSize(window.innerWidth, window.innerHeight);

//     const color = new THREE.Color(0x151515);
//     const fog = new THREE.Fog(color, 15, 30);
//     this.scene = new THREE.Scene();
//     this.scene.fog = fog;
//     this.scene.background = color;

//     this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
//     this.camera.position.set(0, 0, 5);
//     this.controls = new OrbitControls(this.camera, this.renderer.domElement);
//     this.controls.enabled = false;
//     this.controls.maxDistance = 40;
//     this.controls.minDistance = 3;
//     this.controls.minPolarAngle = 0;
//     this.controls.maxPolarAngle = Math.PI / 2 + 0.3;

//     // Add a light to ensure visibility
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
//     this.scene.add(ambientLight);
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
//     directionalLight.position.set(0, 10, 10);
//     this.scene.add(directionalLight);

//     camParallax.init(this.camera);

//     const camFolder = gui.addFolder("Camera Folder");
//     camFolder.open();
//     camFolder.add(this.controls, "enabled").onChange(() => {
//       if (this.controls.enabled) camParallax.active = false;
//     }).listen().name('Orbit Controls');
//     camFolder.add(camParallax, "active").onChange(() => {
//       if (camParallax.active) this.controls.enabled = false;
//     }).listen().name('Cam Parallax');
//     camFolder.add(camParallax.params, "intensity", 0.001, 0.01);
//     camFolder.add(camParallax.params, "ease", 0.01, 0.1);

//     spherePillerClass.init(this.scene);
//     floorClass.init(this.scene);
//     spectrumClass.init(this.scene);
//     particleSystem.init(this.scene);

//     gui.hide();

//     const playPauseButton = document.getElementById('playPauseButton');
//     let initFlag = false;
//     playPauseButton.addEventListener('click', () => {
//       if (!initFlag) {
//         initFlag = true;
//         soundReactor.init();
//       }
//       if (soundReactor.playFlag) {
//         soundReactor.pause();
//         playPauseButton.textContent = 'Play';
//       } else {
//         soundReactor.play();
//         playPauseButton.textContent = 'Pause';
//       }
//     });

//     window.addEventListener("resize", this.resizeCanvas.bind(this));
//     raf.subscribe('threeSceneUpdate', this.update.bind(this));
//   }

//   update() {
//     this.renderer.render(this.scene, this.camera);
//     this.scene.rotateY(0.0015);
//     spherePillerClass.update();
//     spectrumClass.update();
//     particleSystem.update();
//     camParallax.update();
//   }

//   resizeCanvas() {
//     this.renderer.setSize(window.innerWidth, window.innerHeight);
//     this.camera.aspect = window.innerWidth / window.innerHeight;
//     this.camera.updateProjectionMatrix();
//   }

//   bind() {
//     this.init = this.init.bind(this);
//     this.update = this.update.bind(this);
//     this.resizeCanvas = this.resizeCanvas.bind(this);
//   }
// }

// const raf = new RAF();
// const loadingController = new LoadingController();
// const soundReactor = new SoundReactor('/audios/3.mp3');
// const camParallax = new CamParallax();
// const particleSystem = new ParticleSystem();
// const floorClass = new Floor();
// const spherePillerClass = new SpherePillerClass();
// const spectrumClass = new Spectrum();
// const gui = new dat.GUI();

// loadingController.onProgress = (url, loaded, total) => {
//   const progressFill = document.getElementById('progressFill');
//   const progressUrl = document.getElementById('progressUrl');
//   progressUrl.textContent = url;
//   progressFill.style.width = (loaded / total * 100) + '%';
// };

// loadingController.onLoad = () => {
//   const loadingScreen = document.getElementById('loadingScreen');
//   loadingScreen.classList.add('finished');
// };

// const mainScene = new MainThreeScene();
// mainScene.init();



import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as dat from 'dat.gui';
import vertex from './shaders/vertex.glsl';
import fragment from './shaders/fragment.glsl';

class RAF {
  constructor() {
    this.callbacks = [];
    this.render = this.render.bind(this);
    this.render();
  }

  subscribe(name, callback) {
    this.callbacks.push({ name, callback });
  }

  unsubscribe(name) {
    this.callbacks = this.callbacks.filter(item => item.name !== name);
  }

  render() {
    requestAnimationFrame(this.render);
    this.callbacks.forEach(item => item.callback());
  }
}

class LoadingController {
  constructor() {
    this.manager = new THREE.LoadingManager();
    this.manager.onProgress = (url, loaded, total) => {
      if (this.onProgress) this.onProgress(url, loaded, total);
    };
    this.manager.onLoad = () => {
      if (this.onLoad) this.onLoad();
    };
  }
}

class SoundReactor {
  constructor(audioUrl) {
    this.url = audioUrl;
    this.playFlag = false;
    this.bind();
  }

  init() {
    this.ctx = new AudioContext();
    this.audio = new Audio(this.url);
    this.audioSource = this.ctx.createMediaElementSource(this.audio);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.8;
    this.audioSource.connect(this.analyser);
    this.audioSource.connect(this.ctx.destination);
    this.fdata = new Uint8Array(this.analyser.frequencyBinCount);
    this.audio.currentTime = 1;
  }

  play() {
    this.audio.play();
    this.playFlag = true;
    raf.subscribe('audioReactorUpdate', this.update.bind(this));
  }

  pause() {
    this.audio.pause();
    this.playFlag = false;
    raf.unsubscribe('audioReactorUpdate');
  }

  update() {
    this.analyser.getByteFrequencyData(this.fdata);
  }

  bind() {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
  }
}

class CamParallax {
  constructor() {
    this.active = true;
    this.mousePos = { x: 0, y: 0 };
    this.params = {
      intensity: 0.008,
      ease: 0.08,
    };
    this.bind();
  }

  init(camera) {
    this.camera = camera;
    this.initZ = this.camera.position.z;
    window.addEventListener('mousemove', this.onMouseMove);
  }

  onMouseMove(e) {
    this.mousePos.x = (e.clientX - window.innerWidth / 2) * this.params.intensity;
    this.mousePos.y = (e.clientY - window.innerHeight / 2) * this.params.intensity;
    const yLimit = -3.4;
    if (this.mousePos.y < yLimit) this.mousePos.y = yLimit;
  }

  update() {
    if (!this.active) return;
    this.camera.position.x += (this.mousePos.x - this.camera.position.x) * this.params.ease;
    this.camera.position.y += (this.mousePos.y - this.camera.position.y) * this.params.ease;
    this.camera.position.z += (this.initZ - this.camera.position.z) * this.params.ease;
    this.camera.lookAt(0, 0, 0);
  }

  bind() {
    this.onMouseMove = this.onMouseMove.bind(this);
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
  }
}

class ParticleSystem {
  constructor() {
    this.particleCount = 5000;
    this.boxSize = 30;
    this.bind();
  }

  init(scene) {
    this.scene = scene;
    this.particlesGeom = new THREE.BufferGeometry();
    this.particlesPos = [];

    for (let p = 0; p < this.particleCount; p++) {
      let x = Math.random() * this.boxSize - this.boxSize / 2;
      let y = Math.random() * this.boxSize - this.boxSize / 2;
      let z = Math.random() * this.boxSize - this.boxSize / 2;
      this.particlesPos.push(x, y, z);
    }

    this.particlesGeom.setAttribute('position', new THREE.Float32BufferAttribute(this.particlesPos, 3));
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
    });
    this.particleSystem = new THREE.Points(this.particlesGeom, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  update() {
    let i = 0;
    while (i < this.particleCount) {
      this.particlesGeom.attributes.position.array[i * 3 + 1] += 0.01;
      if (this.particlesGeom.attributes.position.array[i * 3 + 1] > this.boxSize / 2) {
        this.particlesGeom.attributes.position.array[i * 3 + 1] = -this.boxSize / 2;
      }
      i++;
    }
    this.particlesGeom.attributes.position.needsUpdate = true;
  }

  bind() {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
  }
}

class Floor {
  constructor() {
    this.modelLoader = new GLTFLoader(loadingController.manager);
    this.bind();
  }

  init(scene) {
    this.scene = scene;
    const floorPath = '/models/floorModel.glb';
    console.log(`Attempting to load floor model from: ${window.location.origin}${floorPath}`);

    this.modelLoader.load(
      floorPath,
      (glb) => {
        glb.scene.traverse(child => {
          if (child instanceof THREE.Mesh) {
            this.floor = child;
            this.floor.scale.multiplyScalar(1.525);
            this.floor.translateY(-2)
            this.scene.add(this.floor);
            // Ensure material is visible
            // if (!child.material) {
            //   child.material = new THREE.MeshStandardMaterial({ color: 0x808080 });
            // }
          }
        });
        // if (this.floor) {
        // //   this.floor.position.set(0, 0, 0);
        // //   this.floor.scale.multiplyScalar(1.525);
        // //   this.floor.translateY(-4)
        // //   this.scene.add(this.floor);
        //   console.log('Floor loaded and added to scene:', this.floor);
        // } else {
        //   console.warn('No mesh found in floorModel.glb');
        //   this.addFallbackFloor();
        // }
      },
    //   undefined,
    //   (error) => {
    //     console.error(`Error loading ${floorPath}:`, error);
    //     // Try alternative path
    //     const altPath = '/models/floorModel.glb';
    //     console.log(`Attempting alternative path: ${window.location.origin}${altPath}`);
    //     this.modelLoader.load(
    //       altPath,
    //       (glb) => {
    //         glb.scene.traverse(child => {
    //           if (child instanceof THREE.Mesh) {
    //             this.floor = child;
    //             if (!child.material) {
    //               child.material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    //             }
    //           }
    //         });
    //         if (this.floor) {
    //           this.floor.position.set(0, -2, 0);
    //           this.floor.scale.multiplyScalar(1.525);
    //           this.scene.add(this.floor);
    //           console.log('Floor loaded from alternative path and added to scene:', this.floor);
    //         } else {
    //           console.warn('No mesh found in alternative floorModel.glb');
    //           this.addFallbackFloor();
    //         }
    //       },
    //       undefined,
    //       (altError) => {
    //         console.error(`Error loading ${altPath}:`, altError);
    //         this.addFallbackFloor();
    //       }
    //     );
    //   }
    );
  }

//   addFallbackFloor() {
//     const fallbackGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
//     const fallbackMaterial = new THREE.MeshStandardMaterial({
//       color: 0x808080,
//       wireframe: true, // Grid-like appearance for visibility
//     });
//     this.floor = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
//     this.floor.rotation.x = -Math.PI / 2;
//     this.floor.position.set(0, -2, 0);
//     this.scene.add(this.floor);
//     console.log('Fallback floor (wireframe plane) added');
//   }

  update() {}

  bind() {
    this.init = this.init.bind(this);
    // this.addFallbackFloor = this.addFallbackFloor.bind(this);
  }
}

class SpherePillerClass {
  constructor() {
    this.modelLoader = new GLTFLoader(loadingController.manager);
    this.texLoader = new THREE.TextureLoader(loadingController.manager);
    this.params = {
      waveSpeed: 1,
      subDiv: 3,
      pillardSize: 0.2,
    };
    this.bind();
  }

  init(scene) {
    this.scene = scene;
    this.upVec = new THREE.Vector3(0, 1, 0);
    this.pillards = new THREE.Group();

    const gTex = this.texLoader.load('/textures/greyMetel.png');
    const bTex = this.texLoader.load('/textures/blackMetel.png');
    this.gMatCap = new THREE.MeshMatcapMaterial({ matcap: gTex });
    this.bMatCap = new THREE.MeshMatcapMaterial({ matcap: bTex });

    this.modelLoader.load(
      '/models/pillarsModels.glb',
      (glb) => {
        glb.scene.traverse(child => {
          if (child.name === "base") {
            this.pillard = child;
            child.material = this.bMatCap;
          }
          if (child.name === "Cylinder") {
            child.material = this.gMatCap;
          }
        });
        this.computePositions();
      },
      undefined,
      (error) => {
        console.error('Error loading soundPillardsModels.glb:', error);
      }
    );

    const sphereFolder = gui.addFolder('Sphere Pillards');
    sphereFolder.open();
    sphereFolder.add(this.params, 'waveSpeed', 0.001, 3).name('Wave Speed');
    sphereFolder.add(this.params, 'subDiv', 1, 5).step(1).name('Ico Subdivisions').onChange(() => this.computePositions());
    sphereFolder.add(this.params, 'pillardSize', 0.01, 1).name('Pill Size').onChange(() => this.computePositions());
  }

  computePositions() {
    let ico;
    this.scene.traverse(child => {
      if (child.name === 'ico') ico = child;
    });
    if (ico) this.scene.remove(ico);

    const sphereGeom = new THREE.IcosahedronGeometry(2, this.params.subDiv);
    const sphere = new THREE.Mesh(sphereGeom, this.gMatCap);
    sphere.name = 'ico';
    this.scene.add(sphere);

    this.pillards.clear();
    let verArray = [];
    for (let i = 0; i < sphereGeom.attributes.position.array.length; i += 3) {
      const x = sphereGeom.attributes.position.array[i];
      const y = sphereGeom.attributes.position.array[i + 1];
      const z = sphereGeom.attributes.position.array[i + 2];
      verArray.push({ x, y, z });
    }

    let pillPos = [];
    for (let i = 0; i < verArray.length; i++) {
      let existsFlag = false;
      for (let j = 0; j < pillPos.length; j++) {
        if (pillPos[j].x === verArray[i].x && pillPos[j].y === verArray[i].y && pillPos[j].z === verArray[i].z) {
          existsFlag = true;
        }
      }
      if (!existsFlag) {
        pillPos.push({ x: verArray[i].x, y: verArray[i].y, z: verArray[i].z });
        const c = this.pillard.clone();
        const posVec = new THREE.Vector3(verArray[i].x, verArray[i].y, verArray[i].z);
        c.position.copy(posVec);
        c.scale.multiplyScalar(this.params.pillardSize);
        c.quaternion.setFromUnitVectors(this.upVec, posVec.normalize());
        this.pillards.add(c);
      }
    }
    this.scene.add(this.pillards);
  }

  update() {
    if (soundReactor.playFlag) {
      let i = 0;
      while (i < this.pillards.children.length) {
        this.pillards.children[i].children[0].position.y = soundReactor.fdata[i] / 255 * 4;
        i++;
      }
    } else {
      let i = 0;
      while (i < this.pillards.children.length) {
        this.pillards.children[i].children[0].position.y = (Math.sin(Date.now() * 0.01 * this.params.waveSpeed + this.pillards.children[i].position.x) + 1) * 1.5;
        i++;
      }
    }
  }

  bind() {
    this.init = this.init.bind(this);
    this.computePositions = this.computePositions.bind(this);
    this.update = this.update.bind(this);
  }
}

class Spectrum {
  constructor() {
    this.modelLoader = new GLTFLoader(loadingController.manager);
    this.textureLoader = new THREE.TextureLoader(loadingController.manager);
    this.bind();
  }

  init(scene) {
    this.scene = scene;
    this.uniforms = {
      uMatCap: { value: this.textureLoader.load('/textures/blackMetel.png') },
      uSpecterSize: { value: 0.8 },
      uWaveBorder: { value: 0.3 },
      uWaveSpeed: { value: 0.1 },
      uBorderColor: { value: new THREE.Color("hsl(287, 80%, 80%)") },
      uTime: { value: 0 },
    };

    this.shaderMat = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: this.uniforms,
      transparent: true,
    });

    this.modelLoader.load(
      '/models/spectrum.glb',
      (glb) => {
        glb.scene.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.material = this.shaderMat;
            child.scale.multiplyScalar(1.5);
            child.position.y = -1.2;
          }
        });
        this.scene.add(glb.scene);
      },
      undefined,
      (error) => {
        console.error('Error loading spectrum.glb:', error);
      }
    );

    const shaderFolder = gui.addFolder("Spectrum Folder");
    shaderFolder.open();
    shaderFolder.add(this.uniforms.uSpecterSize, "value", -1, 1).name('Spectrum Size');
    shaderFolder.add(this.uniforms.uWaveBorder, "value", 0, 1).name('Border Size');
    shaderFolder.add(this.uniforms.uWaveSpeed, "value", 0, 1).name('Wave speed');
  }

  update() {
    this.uniforms.uTime.value += 1;
  }

  bind() {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
  }
}

class MainThreeScene {
  constructor() {
    this.bind();
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl'), antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const color = new THREE.Color(0x151515);
    const fog = new THREE.Fog(color, 5, 40); // Adjusted fog for better visibility
    this.scene = new THREE.Scene();
    this.scene.fog = fog;
    this.scene.background = color;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 5); // Moved camera up for better floor view
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.maxDistance = 40;
    this.controls.minDistance = 3;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.3;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    this.scene.add(directionalLight);

    camParallax.init(this.camera);

    const camFolder = gui.addFolder("Camera Folder");
    camFolder.open();
    camFolder.add(this.controls, "enabled").onChange(() => {
      if (this.controls.enabled) camParallax.active = false;
    }).listen().name('Orbit Controls');
    camFolder.add(camParallax, "active").onChange(() => {
      if (camParallax.active) this.controls.enabled = false;
    }).listen().name('Cam Parallax');
    camFolder.add(camParallax.params, "intensity", 0.001, 0.01);
    camFolder.add(camParallax.params, "ease", 0.01, 0.1);

    spherePillerClass.init(this.scene);
    floorClass.init(this.scene);
    spectrumClass.init(this.scene);
    particleSystem.init(this.scene);

    gui.show(); // Enabled GUI for debugging

    const playPauseButton = document.getElementById('playPauseButton');
    let initFlag = false;
    playPauseButton.addEventListener('click', () => {
      if (!initFlag) {
        initFlag = true;
        soundReactor.init();
      }
      if (soundReactor.playFlag) {
        soundReactor.pause();
        playPauseButton.textContent = 'Play';
      } else {
        soundReactor.play();
        playPauseButton.textContent = 'Pause';
      }
    });

    window.addEventListener("resize", this.resizeCanvas.bind(this));
    raf.subscribe('threeSceneUpdate', this.update.bind(this));
  }

  update() {
    this.renderer.render(this.scene, this.camera);
    this.scene.rotateY(0.0015);
    spherePillerClass.update();
    spectrumClass.update();
    particleSystem.update();
    camParallax.update();
  }

  resizeCanvas() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  bind() {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
  }
}

const raf = new RAF();
const loadingController = new LoadingController();
const soundReactor = new SoundReactor('/audios/3.mp3');
const camParallax = new CamParallax();
const particleSystem = new ParticleSystem();
const floorClass = new Floor();
const spherePillerClass = new SpherePillerClass();
const spectrumClass = new Spectrum();
const gui = new dat.GUI();

loadingController.onProgress = (url, loaded, total) => {
  const progressFill = document.getElementById('progressFill');
  const progressUrl = document.getElementById('progressUrl');
  progressUrl.textContent = url;
  progressFill.style.width = (loaded / total * 100) + '%';
};

loadingController.onLoad = () => {
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.classList.add('finished');
};

const mainScene = new MainThreeScene();
mainScene.init();