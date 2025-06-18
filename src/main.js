import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Pane } from 'tweakpane';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader';
import { DotScreenShader } from 'three/examples/jsm/shaders/DotScreenShader';
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
      this.audio.loop = true;
    }
  }

  play() {
    if (!this.isInitialized) {
      this.init();
    }
    this.audio.play();
    this.playFlag = true;
    this.audio.loop = true;
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
    this.particleCount = 6000;
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
      emissive: 0xffffff,
      emissiveIntensity: 1.0,
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

    this.modelLoader.load(
      floorPath,
      (glb) => {
        glb.scene.traverse(child => {
          if (child instanceof THREE.Mesh) {
            this.floor = child;
            this.floor.scale.multiplyScalar(1.725);
            this.floor.translateY(-3);
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
    this.gMatCap = new THREE.MeshMatcapMaterial({ 
      matcap: gTex,
      emissive: 0xEEABF6,
      emissiveIntensity: 0.5,
    });
    this.bMatCap = new THREE.MeshMatcapMaterial({ 
      matcap: bTex,
      emissive: 0xEEABF6,
      emissiveIntensity: 0.5,
    });

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

    const f = tab.pages[0].addFolder({
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
      label: 'Subdivisions'
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
      uTime: { value: 0 },
    };

    this.shaderMat = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: this.uniforms,
      transparent: true,
    });

    this.modelLoader.load(
      '/models/spectrum.glb', // nedd to fix
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

    const f = tab.pages[0].addFolder({
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
    const colorSettings = {
      lightness: 80,
    };
    const updateBorderColor = () => {
      const hslColor = `hsl(278, 80%, ${colorSettings.lightness}%)`;
      this.uniforms.uBorderColor.value.set(hslColor);
    };
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
    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;
    this.rgbShiftPass = null;
    this.glitchPass = null;
    this.vignettePass = null;
    this.dotScreenPass = null;
    this.postProcessingOptions = {
      effect: 'none', // Default to none
      bloomStrength: 1.5,
      bloomRadius: 0.4,
      bloomThreshold: 0.85,
      rgbShiftAmount: 0.005,
      glitchIntensity: 1.0,
      vignetteOffset: 1.0,
      vignetteDarkness: 1.0,
      dotScreenScale: 10.0,
    };
    this.bind();
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: document.getElementById('webgl'), 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    
    this.exposure = {
      value: 0.5
    };
    this.renderer.toneMappingExposure = this.exposure.value;

    const color = new THREE.Color(0x140A1F);
    const fog = new THREE.Fog(color, 3, 30);
    this.scene = new THREE.Scene();
    this.scene.fog = fog;
    // this.scene.background = color;

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    let cameraZ = window.innerWidth > 600 ? 6.5 : 9.5;
    this.camera.position.set(0, 0, cameraZ);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.maxDistance = 8;
    this.controls.minDistance = 3;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.3;

    // Set up post-processing
    this.setupPostProcessing();

    // Add a point light to enhance brightness for bloom
    const pointLight = new THREE.PointLight(0xFFFFFF, 1, 100);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);

    camParallax.init(this.camera);

    const f = tab.pages[0].addFolder({
      title: 'Controls',
      expanded: true,
    });

    const orbitBinding = f.addBinding(this.controls, 'enabled', { label: 'Orbit Control' }).on('change', () => {
      if (this.controls.enabled) {
        camParallax.active = false;
        parallaxBinding.refresh();
      }
    });

    const parallaxBinding = f.addBinding(camParallax, 'active', { label: 'Cam Parallax' }).on('change', () => {
      if (camParallax.active) {
        this.controls.enabled = false;
        orbitBinding.refresh();
      }
    });

    f.addBinding(this.exposure, 'value', {
      min: 0.1,
      max: 1,
      label: 'Exposure'
    }).on('change', (ev) => {
      this.renderer.toneMappingExposure = ev.value;
    });

    // Add post-processing effect selector
    const postProcessingFolder = tab.pages[1].addFolder({
      title: 'Post-Processing',
      expanded: true,
    });

    postProcessingFolder.addBinding(this.postProcessingOptions, 'effect', {
      label: 'Effect',
      view: 'list',
      options: [
        { text: 'None', value: 'none' },
        { text: 'Bloom', value: 'bloom' },
        { text: 'RGB Shift', value: 'rgbShift' },
        { text: 'Glitch', value: 'glitch' },
        { text: 'Vignette', value: 'vignette' },
        { text: 'Dot Screen', value: 'dotScreen' },
      ]
    }).on('change', () => {
      this.updatePostProcessing();
    });

    // Bloom controls
    const bloomFolder = postProcessingFolder.addFolder({ title: 'Bloom Settings', expanded: true });
    bloomFolder.addBinding(this.postProcessingOptions, 'bloomStrength', {
      min: 0,
      max: 3,
      label: 'Strength'
    }).on('change', (ev) => {
      this.bloomPass.strength = ev.value;
    });
    bloomFolder.addBinding(this.postProcessingOptions, 'bloomRadius', {
      min: 0,
      max: 1,
      label: 'Radius'
    }).on('change', (ev) => {
      this.bloomPass.radius = ev.value;
    });
    bloomFolder.addBinding(this.postProcessingOptions, 'bloomThreshold', {
      min: 0,
      max: 1,
      label: 'Threshold'
    }).on('change', (ev) => {
      this.bloomPass.threshold = ev.value;
    });

    // RGB Shift controls
    const rgbShiftFolder = postProcessingFolder.addFolder({ title: 'RGB Shift Settings', expanded: true });
    rgbShiftFolder.addBinding(this.postProcessingOptions, 'rgbShiftAmount', {
      min: 0,
      max: 0.05,
      label: 'Amount'
    }).on('change', (ev) => {
      this.rgbShiftPass.uniforms.amount.value = ev.value;
    });

    // Glitch controls
    const glitchFolder = postProcessingFolder.addFolder({ title: 'Glitch Settings', expanded: true });
    glitchFolder.addBinding(this.postProcessingOptions, 'glitchIntensity', {
      min: 0,
      max: 2,
      label: 'Intensity'
    });

    // Vignette controls
    const vignetteFolder = postProcessingFolder.addFolder({ title: 'Vignette Settings', expanded: true });
    vignetteFolder.addBinding(this.postProcessingOptions, 'vignetteOffset', {
      min: 0,
      max: 2,
      label: 'Offset'
    }).on('change', (ev) => {
      this.vignettePass.uniforms.offset.value = ev.value;
    });
    vignetteFolder.addBinding(this.postProcessingOptions, 'vignetteDarkness', {
      min: 0,
      max: 2,
      label: 'Darkness'
    }).on('change', (ev) => {
      this.vignettePass.uniforms.darkness.value = ev.value;
    });

    // Dot Screen controls
    const dotScreenFolder = postProcessingFolder.addFolder({ title: 'Dot Screen Settings', expanded: true });
    dotScreenFolder.addBinding(this.postProcessingOptions, 'dotScreenScale', {
      min: 1,
      max: 10,
      label: 'Scale'
    }).on('change', (ev) => {
      this.dotScreenPass.uniforms.scale.value = ev.value;
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

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.postProcessingOptions.bloomStrength,
      this.postProcessingOptions.bloomRadius,
      this.postProcessingOptions.bloomThreshold
    );

    this.rgbShiftPass = new ShaderPass(RGBShiftShader);
    this.rgbShiftPass.uniforms.amount.value = this.postProcessingOptions.rgbShiftAmount;

    this.glitchPass = new GlitchPass();
    this.glitchPass.goWild = false;

    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.offset.value = this.postProcessingOptions.vignetteOffset;
    this.vignettePass.uniforms.darkness.value = this.postProcessingOptions.vignetteDarkness;

    this.dotScreenPass = new ShaderPass(DotScreenShader);
    this.dotScreenPass.uniforms.scale.value = this.postProcessingOptions.dotScreenScale;

    // Initial setup with no effect
    this.updatePostProcessing();
  }

  updatePostProcessing() {
    // Remove all passes except the render pass
    this.composer.passes = [this.renderPass];

    // Add the selected effect
    switch (this.postProcessingOptions.effect) {
      case 'none':
        break;
      case 'bloom':
        this.composer.addPass(this.bloomPass);
        break;
      case 'rgbShift':
        this.composer.addPass(this.rgbShiftPass);
        break;
      case 'glitch':
        this.composer.addPass(this.glitchPass);
        break;
      case 'vignette':
        this.composer.addPass(this.vignettePass);
        break;
      case 'dotScreen':
        this.composer.addPass(this.dotScreenPass);
        break;
    }
  }

  update() {
    if (soundReactor && soundReactor.PARAMS) {
      const amplitude = Math.abs(soundReactor.PARAMS.wave);

      if (soundReactor.playFlag) {
        // Audio-reactive adjustments during playback
        if (this.postProcessingOptions.effect === 'bloom') {
          this.bloomPass.strength = this.postProcessingOptions.bloomStrength + amplitude * 1.5;
          // this.bloomPass.threshold = 0.5 - amplitude + 0.16;
        } else if (this.postProcessingOptions.effect === 'rgbShift') {
          this.rgbShiftPass.uniforms.amount.value = this.postProcessingOptions.rgbShiftAmount + amplitude * 0.05;
        } else if (this.postProcessingOptions.effect === 'glitch') {
          this.glitchPass.goWild = amplitude > 0.5;
          this.glitchPass.uniforms.byp.value = amplitude < 0.2 ? 1 : 0;
        } else if (this.postProcessingOptions.effect === 'vignette') {
          this.vignettePass.uniforms.darkness.value = this.postProcessingOptions.vignetteDarkness + amplitude * 0.8;
        } else if (this.postProcessingOptions.effect === 'dotScreen') {
          this.dotScreenPass.uniforms.scale.value = this.postProcessingOptions.dotScreenScale + amplitude * 5;
        }
      } else {
        // Reset to default values when paused
        if (this.postProcessingOptions.effect === 'bloom') {
          this.bloomPass.strength = this.postProcessingOptions.bloomStrength;
          // this.bloomPass.threshold = 0.85
        } else if (this.postProcessingOptions.effect === 'rgbShift') {
          this.rgbShiftPass.uniforms.amount.value = this.postProcessingOptions.rgbShiftAmount;
        } else if (this.postProcessingOptions.effect === 'glitch') {
          this.glitchPass.goWild = false;
          this.glitchPass.uniforms.byp.value = 0;
        } else if (this.postProcessingOptions.effect === 'vignette') {
          this.vignettePass.uniforms.darkness.value = this.postProcessingOptions.vignetteDarkness;
        } else if (this.postProcessingOptions.effect === 'dotScreen') {
          this.dotScreenPass.uniforms.scale.value = this.postProcessingOptions.dotScreenScale;
        }
      }
    }

    this.composer.render();
    this.scene.rotateY(0.0015);
    spherePillerClass.update();
    spectrumClass.update();
    particleSystem.update();
    camParallax.update();
  }

  resizeCanvas() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  bind() {
    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
  }
}

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
      paneElement.style.width = '62vw';
      paneElement.style.top = 'auto';
      paneElement.style.right = 'auto';
      paneElement.style.bottom = '1rem';
      paneElement.style.left = '1rem';
      paneElement.style.fontSize = '0.75rem';
      paneElement.classList.add('bottom-to-top');
    } else {
      paneElement.style.top = '1rem';
      paneElement.style.right = '1rem';
      paneElement.classList.remove('bottom-to-top');
    }
  }
};

const raf = new RAF();
const loadingController = new LoadingController();
let soundReactor = new SoundReactor('/audios/SankatMochan.mp3');

const soundSrc = {
  url: '/audios/SankatMochan.mp3',
};
pane.addBinding(soundSrc, 'url', {
  label: 'Sound',
  view: 'list',
  options: [
    { text: 'Sankat Mochan', value: '/audios/SankatMochan.mp3' },
    { text: 'Mangal Bhavan', value: '/audios/MangalBhawan.mp3' },
    { text: 'Pachra Maa Kali', value: '/audios/Pachra.mp3' },
  ]
}).on('change', (ev) => {
  soundSrc.url = ev.value;
  soundReactor.setAudioSource(ev.value);
  const playPauseButton = document.getElementById('playPauseButton');
  playPauseButton.disabled = false;
});

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

const tab = pane.addTab({
  pages: [
    {title: 'Settings'},
    {title: 'Post-Processing'},
  ],
});

const mainScene = new MainThreeScene();
mainScene.init();





