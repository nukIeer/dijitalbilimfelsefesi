import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Crosshair, Loader2, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react';
import * as THREE from 'three';

type LinkEndpoint = string | { id: string };

interface CitationNode {
  id: string;
  name: string;
  year?: number;
  citations?: number;
}

interface CitationLink {
  source: LinkEndpoint;
  target: LinkEndpoint;
  value?: number;
}

interface CitationNetwork {
  nodes: CitationNode[];
  links: CitationLink[];
}

interface GraphNode extends CitationNode {
  size: number;
  color: string;
  degree: number;
  rank: number;
  showLabel: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

const CITATION_NETWORK_URL = 'https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/network/citation_network.json';
const HUBBLE_DEEP_FIELD_URL = '/hubble-deep-field.jpg';
const glowTextures = new Map<string, THREE.CanvasTexture>();

function getEndpointId(endpoint: LinkEndpoint) {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

function colorByYear(year?: number) {
  if (!year || year < 1985) return '#f6bd60';
  if (year < 1995) return '#19d3ff';
  if (year < 2005) return '#46f2b0';
  if (year < 2015) return '#ff4fa3';
  return '#9a7dff';
}

function hexToRgba(hex: string, opacity: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getGlowTexture(color: string) {
  const cached = glowTextures.get(color);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.14, hexToRgba(color, 0.88));
  gradient.addColorStop(0.42, hexToRgba(color, 0.3));
  gradient.addColorStop(1, hexToRgba(color, 0));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  glowTextures.set(color, texture);
  return texture;
}

function createLabelSprite(label: string, color: string, nodeSize: number, emphasized: boolean) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();

  const fontSize = emphasized ? 26 : 20;
  const paddingX = emphasized ? 16 : 12;
  const paddingY = emphasized ? 10 : 8;
  context.font = `600 ${fontSize}px Arial`;
  canvas.width = Math.ceil(context.measureText(label).width) + paddingX * 2;
  canvas.height = fontSize + paddingY * 2;

  context.font = `600 ${fontSize}px Arial`;
  const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, 'rgba(2, 8, 23, 0.95)');
  background.addColorStop(1, hexToRgba(color, 0.38));
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = hexToRgba(color, 0.9);
  context.lineWidth = 2;
  context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  context.fillStyle = '#f8fafc';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  sprite.name = 'citation-label';
  sprite.renderOrder = 2;
  const height = Math.max(emphasized ? 9 : 7, nodeSize * (emphasized ? 2.1 : 1.75));
  sprite.scale.set((canvas.width / canvas.height) * height, height, 1);
  sprite.position.set(0, nodeSize + height * 0.7, 0);
  return sprite;
}

function createNodeObject(node: GraphNode) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(node.size, 1),
    new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.7, wireframe: true }),
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(node.size * 0.46, 12, 12),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.92 }),
  );
  group.add(shell, core);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: getGlowTexture(node.color),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  const haloSize = node.size * 4.2;
  halo.scale.set(haloSize, haloSize, 1);
  group.add(halo);

  const title = node.name.length > 34 ? `${node.name.slice(0, 33)}...` : node.name;
  const label = createLabelSprite(title, node.color, node.size, node.showLabel);
  label.visible = node.showLabel;
  group.add(label);

  return group;
}

function createStarLayer(count: number, minimumDistance: number, maximumDistance: number, size: number, opacity: number, seed: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color('#61d8ff'), new THREE.Color('#ff78a8'), new THREE.Color('#ffffff')];
  let randomSeed = seed;
  const random = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
  };

  for (let index = 0; index < count; index += 1) {
    const phi = Math.acos(1 - random() * 2);
    const theta = Math.PI * 2 * random();
    const distance = minimumDistance + random() * (maximumDistance - minimumDistance);
    positions[index * 3] = distance * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
    positions[index * 3 + 2] = distance * Math.cos(phi);
    const color = palette[index % palette.length];
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, opacity, depthWrite: false, sizeAttenuation: true });
  return new THREE.Points(geometry, material);
}

function createStarField() {
  const field = new THREE.Group();
  field.name = 'three-dimensional-star-field';
  field.add(
    createStarLayer(750, 170, 340, 1.75, 0.95, 773),
    createStarLayer(1100, 360, 720, 1.1, 0.72, 1937),
    createStarLayer(1500, 730, 1120, 0.75, 0.5, 6203),
  );
  return field;
}

function createGalaxyParticleCloud(source: CanvasImageSource, seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return new THREE.Points();

  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const count = 1500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let randomSeed = seed;
  const random = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
  };

  let pointIndex = 0;
  let attempts = 0;
  while (pointIndex < count && attempts < count * 45) {
    attempts += 1;
    const pixelX = Math.floor(random() * canvas.width);
    const pixelY = Math.floor(random() * canvas.height);
    const pixelOffset = (pixelY * canvas.width + pixelX) * 4;
    const red = pixels[pixelOffset] / 255;
    const green = pixels[pixelOffset + 1] / 255;
    const blue = pixels[pixelOffset + 2] / 255;
    const brightness = (red + green + blue) / 3;
    const centeredX = pixelX / canvas.width - 0.5;
    const centeredY = pixelY / canvas.height - 0.5;
    const edgeFade = Math.max(0, 1 - Math.hypot(centeredX, centeredY) * 1.25);
    if (random() > Math.min(1, brightness * 1.8 + edgeFade * 0.14)) continue;

    positions[pointIndex * 3] = centeredX * 640;
    positions[pointIndex * 3 + 1] = centeredY * 520;
    positions[pointIndex * 3 + 2] = (random() - 0.5) * 310;
    colors[pointIndex * 3] = Math.min(1, red * 1.35);
    colors[pointIndex * 3 + 1] = Math.min(1, green * 1.35);
    colors[pointIndex * 3 + 2] = Math.min(1, blue * 1.35);
    pointIndex += 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, pointIndex);
  const material = new THREE.PointsMaterial({
    size: 2.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.86,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

function createGalaxyParticleField(source: CanvasImageSource) {
  const field = new THREE.Group();
  field.name = 'hubble-galaxy-particles';
  const clouds = [
    { position: new THREE.Vector3(-80, 65, -720), rotation: new THREE.Euler(-0.1, 0.18, -0.08), scale: 1, seed: 481 },
    { position: new THREE.Vector3(280, -115, -540), rotation: new THREE.Euler(0.15, -0.3, 0.12), scale: 0.62, seed: 1979 },
    { position: new THREE.Vector3(-390, -170, -600), rotation: new THREE.Euler(-0.18, 0.45, 0.2), scale: 0.48, seed: 7109 },
  ];

  for (const cloud of clouds) {
    const particles = createGalaxyParticleCloud(source, cloud.seed);
    particles.position.copy(cloud.position);
    particles.rotation.copy(cloud.rotation);
    particles.scale.setScalar(cloud.scale);
    field.add(particles);
  }

  return field;
}

function disposeSceneObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Points || child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material.dispose();
    }
  });
}

export default function ThreeDVisualization() {
  const [network, setNetwork] = useState<CitationNetwork | null>(null);
  const [nodeLimit, setNodeLimit] = useState(1000);
  const [maxConnections, setMaxConnections] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeObjectsRef = useRef(new Map<string, THREE.Group>());

  useEffect(() => {
    const controller = new AbortController();

    const loadNetwork = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(CITATION_NETWORK_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Atıf ağı yüklenemedi (HTTP ${response.status}).`);

        const data = await response.json() as CitationNetwork;
        if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
          throw new Error('Atıf ağı verisi beklenen biçimde değil.');
        }
        setNetwork(data);
      } catch (cause) {
        if ((cause as Error).name !== 'AbortError') {
          setError((cause as Error).message || 'Atıf ağı yüklenemedi.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadNetwork();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({ width: container.clientWidth, height: container.clientHeight });
    };
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(container);
    updateDimensions();

    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    if (!network) return null;

    const rankedNodes = [...network.nodes]
      .sort((first, second) => (second.citations || 0) - (first.citations || 0))
      .slice(0, nodeLimit);
    const selectedIds = new Set(rankedNodes.map((node) => node.id));
    const nodesById = new Map(rankedNodes.map((node) => [node.id, node]));

    const candidateLinks = network.links
      .flatMap((link): GraphLink[] => {
        const source = getEndpointId(link.source);
        const target = getEndpointId(link.target);
        if (!source || !target || source === target || !selectedIds.has(source) || !selectedIds.has(target)) return [];
        return [{ source, target, value: Number(link.value || 1) }];
      })
      .sort((first, second) => {
        const secondScore = (nodesById.get(second.source)?.citations || 0) + (nodesById.get(second.target)?.citations || 0);
        const firstScore = (nodesById.get(first.source)?.citations || 0) + (nodesById.get(first.target)?.citations || 0);
        return secondScore - firstScore;
      });

    const degree = new Map<string, number>();
    const links: GraphLink[] = [];
    const seenLinks = new Set<string>();

    for (const link of candidateLinks) {
      const key = [link.source, link.target].sort().join('::');
      if (seenLinks.has(key)) continue;
      if ((degree.get(link.source) || 0) >= maxConnections || (degree.get(link.target) || 0) >= maxConnections) continue;

      seenLinks.add(key);
      links.push(link);
      degree.set(link.source, (degree.get(link.source) || 0) + 1);
      degree.set(link.target, (degree.get(link.target) || 0) + 1);
    }

    const connectedNodeIds = new Set<string>();
    for (const link of links) {
      connectedNodeIds.add(link.source);
      connectedNodeIds.add(link.target);
    }
    const ranks = new Map(rankedNodes.map((node, index) => [node.id, index]));

    return {
      nodes: rankedNodes.filter((node) => connectedNodeIds.has(node.id)).map((node): GraphNode => {
        const rank = ranks.get(node.id) || 0;
        return {
          ...node,
          size: Math.max(2, Math.min(8.5, Math.log2((node.citations || 1) + 1) * 0.56)),
          color: colorByYear(node.year),
          degree: degree.get(node.id) || 0,
          rank,
          showLabel: rank < 12,
        };
      }),
      links,
      sourceNodeCount: rankedNodes.length,
    };
  }, [maxConnections, network, nodeLimit]);

  useEffect(() => {
    setSelectedNode(null);
    nodeObjectsRef.current.clear();
    if (!graphRef.current || !graphData) return;

    const charge = graphRef.current.d3Force('charge');
    const link = graphRef.current.d3Force('link');
    charge?.strength(-86).distanceMax(800);
    link?.distance(72).strength(0.9);
  }, [graphData]);

  const graphReady = Boolean(graphData && dimensions.width > 0 && dimensions.height > 0);

  const focusNetwork = () => {
    graphRef.current?.zoomToFit(600, 80);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(focusNetwork);
    return () => window.cancelAnimationFrame(frame);
  }, [isFullscreen]);

  useEffect(() => {
    if (!graphReady) return;

    const controls = graphRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
    }
  }, [autoRotate, graphReady]);

  useEffect(() => {
    if (!graphReady || !graphData) return;

    let frameId = 0;
    let lastUpdate = 0;
    const cameraPosition = new THREE.Vector3();
    const nodePosition = new THREE.Vector3();
    const closeViewDistance = 430;
    const labelRevealDistance = 220;

    const updateLabels = (timestamp: number) => {
      if (timestamp - lastUpdate >= 90) {
        const camera = graphRef.current?.camera?.();
        if (camera) {
          cameraPosition.copy(camera.position);
          const showAllLabels = cameraPosition.length() <= closeViewDistance;
          for (const node of graphData.nodes) {
            const nodeObject = nodeObjectsRef.current.get(node.id);
            const label = nodeObject?.getObjectByName('citation-label');
            if (!label) continue;

            nodeObject.getWorldPosition(nodePosition);
            label.visible = showAllLabels || node.showLabel || nodePosition.distanceTo(cameraPosition) <= labelRevealDistance;
          }
        }
        lastUpdate = timestamp;
      }
      frameId = window.requestAnimationFrame(updateLabels);
    };

    frameId = window.requestAnimationFrame(updateLabels);
    return () => window.cancelAnimationFrame(frameId);
  }, [graphData, graphReady]);

  useEffect(() => {
    if (!graphReady) return;

    const scene = graphRef.current?.scene?.();
    if (!scene) return;

    const previousBackground = scene.background;
    const previousBackgroundIntensity = scene.backgroundIntensity;
    const background = new THREE.Color('#010104');
    const stars = createStarField();
    const textureLoader = new THREE.TextureLoader().setCrossOrigin('anonymous');
    scene.background = background;
    scene.backgroundIntensity = 0.62;
    scene.add(stars);
    let galaxyParticles: THREE.Group | null = null;
    let disposed = false;
    const galaxyTexture = textureLoader.load(HUBBLE_DEEP_FIELD_URL, (texture) => {
      if (disposed) {
        texture.dispose();
        return;
      }
      galaxyParticles = createGalaxyParticleField(texture.image as CanvasImageSource);
      scene.add(galaxyParticles);
      texture.dispose();
    });

    let frameId = 0;
    const animateSpace = () => {
      stars.rotation.y += 0.00008;
      stars.rotation.x = Math.sin(performance.now() * 0.00008) * 0.018;
      if (galaxyParticles) {
        const camera = graphRef.current?.camera?.();
        galaxyParticles.visible = (camera?.position.length() || Infinity) > 430;
        galaxyParticles.rotation.y -= 0.000035;
        galaxyParticles.rotation.z = Math.sin(performance.now() * 0.00006) * 0.012;
      }
      frameId = window.requestAnimationFrame(animateSpace);
    };
    frameId = window.requestAnimationFrame(animateSpace);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      scene.remove(stars);
      disposeSceneObject(stars);
      if (galaxyParticles) {
        scene.remove(galaxyParticles);
        disposeSceneObject(galaxyParticles);
      }
      galaxyTexture.dispose();
      scene.background = previousBackground;
      scene.backgroundIntensity = previousBackgroundIntensity;
    };
  }, [graphReady]);

  return (
    <section className="flex flex-col gap-6 w-full">
      <header className="border-b border-gray-200 pb-5 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[#8A1538] mb-2">
            <span className="text-xs font-bold tracking-widest uppercase">Ağ Analizindeki Verinin 3B Karşılığı</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">3B Atıf Ağı</h2>
          <p className="font-sans text-gray-600 max-w-2xl">Makaleler atıf sayısına göre seçilir; çizilen her çizgi kaynak verideki gerçek bir atıf ilişkisidir. Bağ sınırı, ağın okunabilirliğini korur.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-sans">
          <label className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-600">Makale sayısı</span>
            <select value={nodeLimit} onChange={(event) => setNodeLimit(Number(event.target.value))} className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer">
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={750}>750</option>
              <option value={1000}>1.000</option>
            </select>
          </label>
          <label className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-600">Düğüm başına en fazla bağ</span>
            <select value={maxConnections} onChange={(event) => setMaxConnections(Number(event.target.value))} className="bg-transparent text-xs font-bold text-gray-900 outline-none cursor-pointer">
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </label>
          <button onClick={focusNetwork} className="p-2.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-[#8A1538] hover:border-[#8A1538]/30 transition-colors shadow-sm" title="Ağa odaklan" aria-label="Ağa odaklan">
            <Crosshair className="w-4 h-4" />
          </button>
          <button onClick={() => setAutoRotate((active) => !active)} className="p-2.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-[#8A1538] hover:border-[#8A1538]/30 transition-colors shadow-sm" title={autoRotate ? 'Otomatik dönüşü durdur' : 'Otomatik dönüşü başlat'} aria-label={autoRotate ? 'Otomatik dönüşü durdur' : 'Otomatik dönüşü başlat'}>
            {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsFullscreen((active) => !active)} className="p-2.5 bg-white border border-gray-200 rounded-md text-gray-600 hover:text-[#8A1538] hover:border-[#8A1538]/30 transition-colors shadow-sm" title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran yap'} aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran yap'}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div data-testid="citation-network-3d" className={isFullscreen ? 'fixed inset-0 z-[100] h-[100dvh] overflow-hidden border border-slate-800 bg-black shadow-[inset_0_0_120px_rgba(25,211,255,0.18)]' : 'relative h-[680px] overflow-hidden border border-slate-800 bg-black shadow-[inset_0_0_120px_rgba(25,211,255,0.18)]'}>
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-3 border-b border-white/10 bg-black/75 px-5 py-4 text-white backdrop-blur-sm pointer-events-none sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold tracking-wide text-white/80">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f6bd60]" />1984 ve öncesi</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#19d3ff]" />1985-1994</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#46f2b0]" />1995-2004</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff4fa3]" />2005 ve sonrası</span>
            <span className="hidden lg:inline text-white/55">Renk: yayın yılı · Boyut: atıf sayısı · Yakınlaşınca tüm makale etiketleri açılır</span>
          </div>
          <div className="flex items-center gap-3">
            {graphData && <span className="font-mono text-xs text-white/65">Üst {graphData.sourceNodeCount.toLocaleString('tr-TR')} içinden {graphData.nodes.length} bağlı makale · {graphData.links.length.toLocaleString('tr-TR')} gerçek atıf bağı</span>}
            <button onClick={() => setIsFullscreen((active) => !active)} className="pointer-events-auto p-2 text-white/70 transition-colors hover:text-white" title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran yap'} aria-label={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran yap'}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div ref={containerRef} className="h-full w-full">
          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-[#63d8ff]" />
              <p className="font-serif text-lg font-bold">Atıf ağı kuruluyor</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
              <p className="font-serif text-lg font-bold">Atıf ağı yüklenemedi</p>
              <p className="max-w-lg text-sm text-white/65">{error}</p>
            </div>
          )}

          {!loading && !error && graphReady && (
            /* @ts-ignore react-force-graph-3d does not include local type declarations */
            <ForceGraph3D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              backgroundColor="#010104"
              showNavInfo={false}
              enableNodeDrag={false}
              nodeLabel={(node: GraphNode) => `${node.name} (${node.year || 'Yıl bilinmiyor'}) · ${node.citations || 0} atıf`}
              nodeThreeObject={(node: GraphNode) => {
                const object = createNodeObject(node);
                nodeObjectsRef.current.set(node.id, object);
                return object;
              }}
              linkColor={() => 'rgba(99, 216, 255, 0.48)'}
              linkWidth={() => 0.75}
              linkDirectionalParticles={1}
              linkDirectionalParticleColor={() => '#f8fafc'}
              linkDirectionalParticleWidth={1.5}
              linkDirectionalParticleSpeed={0.0025}
              onNodeClick={(node: GraphNode) => {
                setSelectedNode(node);
                setAutoRotate(false);
              }}
              onBackgroundClick={() => setSelectedNode(null)}
              onEngineStop={focusNetwork}
              d3AlphaDecay={0.028}
              d3VelocityDecay={0.3}
            />
          )}
        </div>

        {selectedNode && (
          <div className="absolute bottom-5 left-5 z-10 max-w-[min(28rem,calc(100%-2.5rem))] border border-white/15 bg-[#07172d]/95 px-4 py-3 text-white shadow-lg backdrop-blur-sm">
            <div className="flex items-start justify-between gap-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#f6bd60]">Seçili makale</span>
                <p className="mt-1 font-serif text-base font-bold leading-snug">{selectedNode.name}</p>
                <p className="mt-2 text-xs text-white/65">{selectedNode.year || 'Yıl bilinmiyor'} · {selectedNode.citations || 0} atıf · Görünür ağda {selectedNode.degree} bağlantı</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="pointer-events-auto p-1 text-white/60 transition-colors hover:text-white" title="Seçimi temizle" aria-label="Seçimi temizle">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
