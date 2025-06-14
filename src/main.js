import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {Pane} from 'tweakpane';
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
    this.isInitialized = false;
    this.PARAMS = { wave: 0 };
    this.bind();
  }

  init() {
    if (this.isInitialized) return;

    this.ctx = new AudioContext();
    this.audio = new Audio(this.url);
    this.audioSource = this.ctx.createMediaElementSource(this.audio);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.8;
    this.audioSource.connect(this.analyser);
    this.audioSource.connect(this.ctx.destination);
    this.fdata = new Uint8Array(this.analyser.frequencyBinCount);
    this.audio.currentTime = 1;

    this.isInitialized = true;
  }

  setAudioSource(newUrl) {
    if (!this.isInitialized) {
      this.url = newUrl;
      return;
    }

    this.url = newUrl;
    this.audio.pause();
    this.audioSource.disconnect();
    this.audio = new Audio(this.url);
    this.audioSource = this.ctx.createMediaElementSource(this.audio);
    this.audioSource.connect(this.analyser);
    this.audioSource.connect(this.ctx.destination);
    this.audio.currentTime = 1;

    if (this.playFlag) {
      this.audio.play();
    }
  }

  play() {
    if (!this.isInitialized) {
      this.init();
    }
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
    if (!this.isInitialized) return;
    this.analyser.getByteFrequencyData(this.fdata);
    const avgAmplitude = this.fdata.reduce((sum, val) => sum + val, 0) / this.fdata.length;
    this.PARAMS.wave = (avgAmplitude / 255) * 2 - 1;
  }

  bind() {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.setAudioSource = this.setAudioSource.bind(this);
  }
}

class CamParallax {
  constructor() {
    this.active = true;
    this.mousePos = { x: 0, y: 0 };
    this.params = {
      intensity: 0.006,
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
      size: 0.025,
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
    // console.log(`Attempting to load floor model from: ${window.location.origin}${floorPath}`);

    this.modelLoader.load(
      floorPath,
      (glb) => {
        glb.scene.traverse(child => {
          if (child instanceof THREE.Mesh) {
            this.floor = child;
            this.floor.scale.multiplyScalar(1.725);
            this.floor.translateY(-3)
            this.scene.add(this.floor);
          }
        });
      },
    );
  }

  update() {}

  bind() {
    this.init = this.init.bind(this);
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

    const f = pane.addFolder({
      title: 'Sphere Pillars',
      expanded: true,
    });
    
    f.addBinding(this.params, 'waveSpeed', {
      min: 0.001,
      max: 1.5,
      label: 'Movement Speed'
    });
    f.addBinding(this.params, 'subDiv', {
      min: 2,
      max: 5,
      step: 1,
      label: 'Sub Divisions'
    }).on('change', () => this.computePositions());
    f.addBinding(this.params, 'pillardSize', {
      min: 0.01,
      max: 0.25,
      label: 'Pillars Size'
    }).on('change', () => this.computePositions());
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
      // uBorderColor: { value: new THREE.Color("#EEABF6") },
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
            child.scale.multiplyScalar(2.25);
            child.position.y = -3;
          }
        });
        this.scene.add(glb.scene);
      },
      undefined,
      (error) => {
        console.error('Error loading spectrum.glb:', error);
      }
    );
    const colorSettings = {
      // hue: 287, // Initial hue (matches #EEABF6)
      lightness: 80, // Initial lightness (matches #EEABF6)
    };

    const updateBorderColor = () => {
      const hslColor = `hsl(278, 80%, ${colorSettings.lightness}%)`;
      this.uniforms.uBorderColor.value.set(hslColor);
    };
    const f = pane.addFolder({
      title: 'Spectrum Settings',
      expanded: true,
    });

    f.addBinding(this.uniforms.uSpecterSize, 'value', {
      min: -1,
      max: 1,
      label: 'Spectrum Size'
    });
    f.addBinding(this.uniforms.uWaveBorder, 'value', {
      min: 0,
      max: 1,
      label: 'Border Size'
    });
    f.addBinding(this.uniforms.uWaveSpeed, 'value', {
      min: 0,
      max: 0.5,
      label: 'Wave speed'
    });
    f.addBinding(colorSettings, 'lightness', {
      min: 5,
      max: 100,
      step: 1,
      label: 'Color Brightness'
    }).on('change', updateBorderColor);

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
    this.renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('webgl'), 
        antialias: true ,
        alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    
    this.exposure = {
      value: 0.5
    }

    this.renderer.toneMappingExposure = this.exposure.value;

    const color = new THREE.Color(0x151515);
    const fog = new THREE.Fog(color, 3, 30);
    this.scene = new THREE.Scene();
    this.scene.fog = fog;
    this.scene.background = color;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    let cameraZ = window.innerWidth > 600 ? 6.5 : 9.5;
    // this.camera.position.set(0, 0, 6.5);
    this.camera.position.set(0, 0, cameraZ);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.maxDistance = 8;
    this.controls.minDistance = 3;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.3;

    camParallax.init(this.camera);

    const f = pane.addFolder({
      title: 'Controls',
      expanded: true,
    });

    // Store references to the bindings
    const orbitBinding = f.addBinding(this.controls, 'enabled', { label: 'Orbit Control' }).on('change', () => {
      if (this.controls.enabled) {
        camParallax.active = false;
        parallaxBinding.refresh(); // Refresh the Cam Parallax toggle UI
      }
    });

    const parallaxBinding = f.addBinding(camParallax, 'active', { label: 'Cam Parallax' }).on('change', () => {
      if (camParallax.active) {
        this.controls.enabled = false;
        orbitBinding.refresh(); // Refresh the Orbit Controls toggle UI
      }
    });

    f.addBinding(this.exposure, 'value', {
      min: 0.1,
      max: 1,
      label: 'Exposure'
    }).on('change', (ev) => {
      this.renderer.toneMappingExposure = ev.value;
    });

    spherePillerClass.init(this.scene);
    floorClass.init(this.scene);
    spectrumClass.init(this.scene);
    particleSystem.init(this.scene);

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



// const pane = new Pane();

// const soundSrc = {
//   url: '/audios/sankatmochan.mp3',
// };

// pane.addBinding(soundSrc, 'url', {
//   label: "Sound",
//   view: 'list',
//   options: [
//     { text: 'Sankat Mochan', value: '/audios/sankatmochan.mp3' },
//     { text: 'Track 3', value: '/audios/3.mp3' },
//     { text: 'Track 2', value: '/audios/2.mp3' },
//   ]
// }).on('change', (ev) => {
//   soundSrc.url = ev.value;
//   soundReactor.setAudioSource(ev.value);
// });

// const raf = new RAF();
// const loadingController = new LoadingController();
// let soundReactor = new SoundReactor(soundSrc.url);
// // let soundReactor = new SoundReactor('/audios/sankatmochan.mp3'); 

// // Set up the Tweakpane graph for soundReactor
// const audioFolder = pane.addFolder({
//   title: 'Audio Analysis',
//   expanded: true,
// });

// audioFolder.addBinding(soundReactor.PARAMS, 'wave', {
//   readonly: true,
//   view: 'graph',
//   min: -1,
//   max: +1,
//   label: 'Amplitude',
// });

// const camParallax = new CamParallax();
// const particleSystem = new ParticleSystem();
// const floorClass = new Floor();
// const spherePillerClass = new SpherePillerClass();
// const spectrumClass = new Spectrum();

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



const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const pane = new Pane({
  title: "Customization",
  expanded: window.innerWidth > 600
});

const adjustPaneWidth = () => {
  const paneElement = document.querySelector('.tp-dfwv');
  if (paneElement) {
    if (window.innerWidth < 600) {
      // Small screens: 50vw width, bottom-left position, add class for bottom-to-top animation
      paneElement.style.width = '62vw';
      paneElement.style.top = 'auto';
      paneElement.style.right = 'auto';
      paneElement.style.bottom = '1rem';
      paneElement.style.left = '1rem';
      paneElement.style.fontSize = '0.75rem';
      paneElement.classList.add('bottom-to-top');
    } else {
      // Larger screens: 320px width, default top-right position, remove bottom-to-top class
      // paneElement.style.width = '320px';
      paneElement.style.top = '1rem';
      paneElement.style.right = '1rem';
      // paneElement.style.bottom = 'auto';
      // paneElement.style.left = 'auto';
      paneElement.classList.remove('bottom-to-top');
    }
  }
};

const raf = new RAF();
const loadingController = new LoadingController();
let soundReactor = new SoundReactor('/audios/sankatmochan.mp3'); // Default track

const soundSrc = {
  url: '/audios/sankatmochan.mp3',
};
pane.addBinding(soundSrc, 'url', {
  label: 'Sound',
  view: 'list',
  options: [
    { text: 'Sankat Mochan', value: '/audios/sankatmochan.mp3' },
    { text: 'Track 3', value: '/audios/3.mp3' },
    { text: 'Track 2', value: '/audios/2.mp3' },
  ]
}).on('change', (ev) => {
  soundSrc.url = ev.value;
  soundReactor.setAudioSource(ev.value);
  const playPauseButton = document.getElementById('playPauseButton');
  playPauseButton.disabled = false; // Enable play button when a track is selected
});



// Set up Tweakpane graph for soundReactor
const audioFolder = pane.addFolder({
  title: 'Audio Analysis',
  expanded: true,
});
audioFolder.addBinding(soundReactor.PARAMS, 'wave', {
  readonly: true,
  view: 'graph',
  min: -1,
  max: +1,
  label: 'Amplitude',
});

// Update time display
const timeDisplay = document.getElementById('time');
const updateTimeDisplay = () => {
  if (soundReactor.audio) {
    const currentTime = soundReactor.audio.currentTime || 0;
    const duration = soundReactor.audio.duration || 0;
    timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  } else {
    timeDisplay.textContent = '00:00 / 00:00';
  }
};
raf.subscribe('timeDisplayUpdate', updateTimeDisplay);

// Tweakpane audio selection

const camParallax = new CamParallax();
const particleSystem = new ParticleSystem();
const floorClass = new Floor();
const spherePillerClass = new SpherePillerClass();
const spectrumClass = new Spectrum();

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

adjustPaneWidth();
window.addEventListener('resize', adjustPaneWidth);

const mainScene = new MainThreeScene();
mainScene.init();