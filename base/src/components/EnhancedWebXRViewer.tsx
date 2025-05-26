
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, Eye, Maximize2, Minimize2, Layers, Share2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from '@/hooks/use-toast';
import { loadSettings } from '@/utils/localStorage';

// Dynamically import GLTFLoader to fix TypeScript error
let GLTFLoader: any;
import('three/examples/jsm/loaders/GLTFLoader.js').then(module => {
  GLTFLoader = module.GLTFLoader;
});

export type OrganType = 'heart' | 'brain' | 'lungs' | 'skeleton';

interface EnhancedWebXRViewerProps {
  initialOrgan?: OrganType;
  enableXR?: boolean;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
}

const EnhancedWebXRViewer: React.FC<EnhancedWebXRViewerProps> = ({ 
  initialOrgan = 'heart',
  enableXR = true,
  className,
  quality = 'medium'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [organ, setOrgan] = useState<OrganType>(initialOrgan);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isXRSession, setIsXRSession] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'3d' | 'xray' | 'annotated'>('3d');
  const [modelQuality, setModelQuality] = useState<'low' | 'medium' | 'high'>(quality);
  
  // Scene variables
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const frameIdRef = useRef<number>(0);
  
  // Load settings
  useEffect(() => {
    const settings = loadSettings();
    if (settings.anatomyModelDetail) {
      setModelQuality(settings.anatomyModelDetail);
    }
  }, []);
  
  // Check if WebXR is supported
  useEffect(() => {
    if (enableXR && 'xr' in navigator) {
      // @ts-ignore - Property xr exists on navigator in browsers that support WebXR
      navigator.xr?.isSessionSupported('immersive-ar')
        .then((supported: boolean) => {
          setIsSupported(supported);
        })
        .catch((error: any) => {
          console.error('Error checking XR support:', error);
          setIsSupported(false);
        });
    }
  }, [enableXR]);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Initialize scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: modelQuality !== 'low',
      alpha: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = modelQuality !== 'low';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add spotlight for dramatic effect
    const spotlight = new THREE.SpotLight(0xffffff, 1);
    spotlight.position.set(0, 10, 0);
    spotlight.angle = Math.PI / 4;
    spotlight.penumbra = 0.1;
    spotlight.decay = 2;
    spotlight.distance = 200;
    spotlight.castShadow = modelQuality === 'high';
    scene.add(spotlight);
    
    // Initialize clock for animations
    clockRef.current = new THREE.Clock();
    
    // Load model based on selected organ
    loadModel(organ);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
      
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Update animations if any
      if (mixerRef.current && clockRef.current) {
        mixerRef.current.update(clockRef.current.getDelta());
      }
      
      // Rotate model for demonstration
      if (modelRef.current) {
        modelRef.current.rotation.y += 0.005;
      }
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };
    
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      // Clean up the scene
      if (sceneRef.current) {
        while (sceneRef.current.children.length > 0) {
          const object = sceneRef.current.children[0];
          sceneRef.current.remove(object);
        }
      }
    };
  }, [modelQuality]);
  
  // Function to load 3D model
  const loadModel = async (organType: OrganType) => {
    if (!sceneRef.current) return;
    
    // Remove previous model if exists
    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }
    
    // Wait for dynamic import
    if (!GLTFLoader) {
      await import('three/examples/jsm/loaders/GLTFLoader.js').then(module => {
        GLTFLoader = module.GLTFLoader;
      });
    }
    
    // Create a loader
    const loader = new GLTFLoader();
    
    // Show loading progress
    setLoadingProgress(0);
    
    // Map organ type to model path (placeholder paths)
    let modelPath = '';
    switch (organType) {
      case 'heart':
        modelPath = '/models/heart.glb';
        break;
      case 'brain':
        modelPath = '/models/brain.glb';
        break;
      case 'lungs':
        modelPath = '/models/lungs.glb';
        break;
      case 'skeleton':
        modelPath = '/models/skeleton.glb';
        break;
      default:
        // Fallback to a simple cube if no model is available
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        sceneRef.current.add(mesh);
        modelRef.current = mesh;
        setLoadingProgress(100);
        return;
    }
    
    // Load the model
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(2, 2, 2);
        model.position.set(0, 0, 0);
        
        // Set up shadows
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Apply materials based on view mode
            if (viewMode === 'xray') {
              (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7,
                wireframe: true
              });
            } else if (viewMode === 'annotated') {
              // No special material for annotated, we'll add labels separately
            }
          }
        });
        
        sceneRef.current?.add(model);
        modelRef.current = model;
        
        // Set up animations if any
        if (gltf.animations.length) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const action = mixerRef.current.clipAction(gltf.animations[0]);
          action.play();
        }
        
        setLoadingProgress(100);
      },
      (progress) => {
        if (progress.lengthComputable) {
          const progressPercentage = Math.round((progress.loaded / progress.total) * 100);
          setLoadingProgress(progressPercentage);
        }
      },
      (error) => {
        console.error('Error loading model:', error);
        // Fallback to cube on error
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        sceneRef.current?.add(mesh);
        modelRef.current = mesh;
        setLoadingProgress(100);
      }
    );
  };
  
  // Handle organ change
  useEffect(() => {
    loadModel(organ);
  }, [organ, viewMode]);
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
      document?.exitFullscreen?.()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error('Error attempting to exit fullscreen:', err);
        });
    }
  };
  
  // Start WebXR session
  const startXRSession = async () => {
    if (!rendererRef.current || !isSupported) return;
    
    try {
      // @ts-ignore - Property xr exists on navigator in browsers that support WebXR
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
      });
      
      // Set up XR rendering
      await rendererRef.current.xr.setSession(session);
      rendererRef.current.xr.enabled = true;
      
      setIsXRSession(true);
      
      toast({
        title: "AR Mode Activated",
        description: "Explore the 3D model in augmented reality",
      });
      
      // Handle session end
      session.addEventListener('end', () => {
        setIsXRSession(false);
        rendererRef.current!.xr.enabled = false;
        
        toast({
          title: "AR Mode Ended",
          description: "Returned to standard 3D view",
        });
      });
      
    } catch (err) {
      console.error('Error starting XR session:', err);
      
      toast({
        title: "AR Error",
        description: "Could not start AR session. Check device compatibility.",
        variant: "destructive"
      });
    }
  };
  
  // End WebXR session
  const endXRSession = () => {
    if (!rendererRef.current?.xr.getSession()) return;
    
    rendererRef.current.xr.getSession()?.end();
  };
  
  // Change view mode
  const changeViewMode = (mode: '3d' | 'xray' | 'annotated') => {
    setViewMode(mode);
    // Reload model with new material settings
    loadModel(organ);
    
    toast({
      title: `${mode.toUpperCase()} View`,
      description: `Switched to ${mode} visualization mode`,
    });
  };
  
  // Share model viewer
  const shareViewer = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MedXRchain 3D Model',
          text: `Check out this 3D model of a human ${organ}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast({
            title: "URL Copied",
            description: "Link copied to clipboard",
          });
        })
        .catch((err) => {
          console.error('Error copying URL:', err);
        });
    }
  };
  
  return (
    <Card className={`${className} overflow-hidden relative`}>
      <CardHeader className="py-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Advanced Medical Viewer</span>
          <div className="flex gap-2">
            {enableXR && isSupported && !isXRSession && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={startXRSession}
                className="flex items-center gap-1"
              >
                <Box className="h-4 w-4" />
                <span>Launch AR</span>
              </Button>
            )}
            
            {isXRSession && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={endXRSession}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                <span>Exit AR</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? 
                <Minimize2 className="h-4 w-4" /> : 
                <Maximize2 className="h-4 w-4" />
              }
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Advanced 3D medical visualization with AR capabilities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex border-t">
          <div className="w-1/4 p-4 border-r">
            <h3 className="font-medium mb-2">Organ Models</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant={organ === 'heart' ? 'default' : 'outline'}
                onClick={() => setOrgan('heart')}
                className="justify-start"
              >
                Heart
              </Button>
              <Button
                variant={organ === 'brain' ? 'default' : 'outline'}
                onClick={() => setOrgan('brain')}
                className="justify-start"
              >
                Brain
              </Button>
              <Button
                variant={organ === 'lungs' ? 'default' : 'outline'}
                onClick={() => setOrgan('lungs')}
                className="justify-start"
              >
                Lungs
              </Button>
              <Button
                variant={organ === 'skeleton' ? 'default' : 'outline'}
                onClick={() => setOrgan('skeleton')}
                className="justify-start"
              >
                Skeleton
              </Button>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">View Mode</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant={viewMode === '3d' ? 'default' : 'outline'}
                  onClick={() => changeViewMode('3d')}
                  className="justify-start"
                  size="sm"
                >
                  <Box className="h-4 w-4 mr-2" />
                  3D View
                </Button>
                <Button
                  variant={viewMode === 'xray' ? 'default' : 'outline'}
                  onClick={() => changeViewMode('xray')}
                  className="justify-start"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  X-Ray View
                </Button>
                <Button
                  variant={viewMode === 'annotated' ? 'default' : 'outline'}
                  onClick={() => changeViewMode('annotated')}
                  className="justify-start"
                  size="sm"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Annotated View
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Model Quality</h3>
              <div className="flex flex-col gap-2">
                <Button
                  variant={modelQuality === 'low' ? 'default' : 'outline'}
                  onClick={() => setModelQuality('low')}
                  className="justify-start"
                  size="sm"
                >
                  Low (Faster)
                </Button>
                <Button
                  variant={modelQuality === 'medium' ? 'default' : 'outline'}
                  onClick={() => setModelQuality('medium')}
                  className="justify-start"
                  size="sm"
                >
                  Medium
                </Button>
                <Button
                  variant={modelQuality === 'high' ? 'default' : 'outline'}
                  onClick={() => setModelQuality('high')}
                  className="justify-start"
                  size="sm"
                >
                  High (Detailed)
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={shareViewer}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share View
              </Button>
            </div>
          </div>
          
          <div className="w-3/4 relative" style={{ height: '400px' }}>
            <div ref={containerRef} className="w-full h-full bg-black/10" />
            
            {loadingProgress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-center">
                  <p className="font-medium text-lg">Loading Model...</p>
                  <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {viewMode === 'annotated' && loadingProgress === 100 && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {organ === 'heart' && 'Left Ventricle'}
                  {organ === 'brain' && 'Cerebrum'}
                  {organ === 'lungs' && 'Bronchi'}
                  {organ === 'skeleton' && 'Ribcage'}
                </div>
                <div className="absolute top-1/2 right-1/4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {organ === 'heart' && 'Right Atrium'}
                  {organ === 'brain' && 'Cerebellum'}
                  {organ === 'lungs' && 'Alveoli'}
                  {organ === 'skeleton' && 'Femur'}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Heart component defined
const Heart: React.FC = () => (
  <div className="heart-component">
    <p>This is a placeholder for a heart component</p>
  </div>
);

export default EnhancedWebXRViewer;
