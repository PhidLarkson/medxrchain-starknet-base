
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brain, Heart, Wind, Eye, Droplet, Box, Loader, RotateCcw, X } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { toast } from '@/hooks/use-toast';

export type OrganType = 'heart' | 'brain' | 'lungs' | 'kidney' | 'eye' | 'cube';

interface ThreeDViewerProps {
  initialOrgan?: OrganType;
  enableXR?: boolean;
  className?: string;
  onModelChange?: (type: OrganType) => void;
}

const ThreeDViewer = ({ 
  initialOrgan = 'heart', 
  enableXR = false,
  className, 
  onModelChange 
}: ThreeDViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const frameIdRef = useRef<number>(0);
  const xrSessionRef = useRef<any>(null);
  const hitTestSourceRef = useRef<any>(null);
  const reticleRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isXRAvailable, setIsXRAvailable] = useState(false);
  const [isInXRSession, setIsInXRSession] = useState(false);
  const [currentOrgan, setCurrentOrgan] = useState<OrganType>(initialOrgan);
  const [isRotating, setIsRotating] = useState(true);

  // Check if WebXR is supported
  useEffect(() => {
    if (typeof navigator.xr !== 'undefined') {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsXRAvailable(supported);
        console.info("AR supported:", supported);
      });
    }
  }, []);

  // Set up the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 1.5;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create reticle for AR mode
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
    const reticleMaterial = new THREE.MeshBasicMaterial();
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Start animation loop
    const animate = () => {
      if (!isInXRSession) {
        frameIdRef.current = requestAnimationFrame(animate);

        if (modelRef.current && isRotating) {
          modelRef.current.rotation.y += 0.01;
        }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };

    animate();

    // Load initial model
    loadModel(initialOrgan);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      
      if (xrSessionRef.current) {
        xrSessionRef.current.end();
      }
      
      if (rendererRef.current && containerRef.current) {
        if (rendererRef.current.domElement.parentElement === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current = null;
      }
    };
  }, [initialOrgan]);

  // Create different anatomical models
  const loadModel = (type: OrganType) => {
    setIsLoading(true);

    // Remove previous model if exists
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    let model: THREE.Object3D;

    // Create different anatomical models based on type
    switch (type) {
      case "heart":
        // Create a stylized heart shape
        const heartShape = new THREE.Shape();
        
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, -0.5, -1, -0.5, -1, 0);
        heartShape.bezierCurveTo(-1, 0.5, 0, 1, 0, 1.5);
        heartShape.bezierCurveTo(0, 1, 1, 0.5, 1, 0);
        heartShape.bezierCurveTo(1, -0.5, 0, -0.5, 0, 0);
        
        const extrudeSettings = {
          depth: 0.5,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 2,
          bevelSize: 0.1,
          bevelThickness: 0.1
        };
        
        const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xe91e63,
          metalness: 0.1,
          roughness: 0.5,
          clearcoat: 0.3,
          clearcoatRoughness: 0.4,
        });
        
        model = new THREE.Mesh(geometry, material);
        model.scale.set(0.5, 0.5, 0.5);
        model.rotation.x = Math.PI;
        break;
        
      case "brain":
        // Create a stylized brain
        const brainGeometry = new THREE.SphereGeometry(0.7, 32, 32);
        
        // Create a detailed brain-like material
        const brainMaterial = new THREE.MeshStandardMaterial({
          color: 0xe0bfb8,
          roughness: 0.8,
          metalness: 0.2,
        });
        
        const brainMesh = new THREE.Mesh(brainGeometry, brainMaterial);
        
        // Add surface details to make it look more like a brain
        const brainDetail = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.65, 0.1, 128, 32, 2, 3),
          new THREE.MeshStandardMaterial({
            color: 0xd0aca6,
            roughness: 0.7,
            metalness: 0.2,
          })
        );
        
        brainMesh.add(brainDetail);
        model = brainMesh;
        break;
        
      case "lungs":
        // Create a pair of stylized lungs
        const lungsGroup = new THREE.Group();
        
        // Left lung
        const leftLung = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
          new THREE.MeshStandardMaterial({
            color: 0xf08080,
            roughness: 0.7,
            metalness: 0.2,
          })
        );
        leftLung.position.set(-0.5, 0, 0);
        leftLung.scale.set(0.8, 1, 0.6);
        lungsGroup.add(leftLung);
        
        // Right lung
        const rightLung = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
          new THREE.MeshStandardMaterial({
            color: 0xf08080,
            roughness: 0.7,
            metalness: 0.2,
          })
        );
        rightLung.position.set(0.5, 0, 0);
        rightLung.scale.set(0.8, 1, 0.6);
        lungsGroup.add(rightLung);
        
        // Trachea
        const trachea = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16),
          new THREE.MeshStandardMaterial({
            color: 0xf0e68c,
            roughness: 0.6,
            metalness: 0.2,
          })
        );
        trachea.position.set(0, 0.5, 0);
        lungsGroup.add(trachea);
        
        // Bronchi
        const leftBronchus = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16),
          new THREE.MeshStandardMaterial({
            color: 0xf0e68c,
            roughness: 0.6,
            metalness: 0.2,
          })
        );
        leftBronchus.position.set(-0.2, 0.3, 0);
        leftBronchus.rotation.z = Math.PI / 4;
        lungsGroup.add(leftBronchus);
        
        const rightBronchus = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16),
          new THREE.MeshStandardMaterial({
            color: 0xf0e68c,
            roughness: 0.6,
            metalness: 0.2,
          })
        );
        rightBronchus.position.set(0.2, 0.3, 0);
        rightBronchus.rotation.z = -Math.PI / 4;
        lungsGroup.add(rightBronchus);
        
        model = lungsGroup;
        break;
        
      case "kidney":
        // Create a stylized kidney
        const kidneyShape = new THREE.Shape();
        
        kidneyShape.moveTo(0, 0);
        kidneyShape.bezierCurveTo(0.2, 0.5, 0.8, 0.5, 1, 0);
        kidneyShape.bezierCurveTo(1.2, -0.5, 0.8, -1, 0.5, -1);
        kidneyShape.bezierCurveTo(0.2, -1, -0.2, -0.5, 0, 0);
        
        const kidneyExtrudeSettings = {
          depth: 0.3,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 2,
          bevelSize: 0.1,
          bevelThickness: 0.1
        };
        
        const kidneyGeometry = new THREE.ExtrudeGeometry(kidneyShape, kidneyExtrudeSettings);
        const kidneyMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xa52a2a,
          metalness: 0.1,
          roughness: 0.7,
        });
        
        const kidneyMesh = new THREE.Mesh(kidneyGeometry, kidneyMaterial);
        kidneyMesh.scale.set(0.5, 0.5, 0.5);
        
        // Create a pair of kidneys
        const kidneyPair = new THREE.Group();
        
        const leftKidney = kidneyMesh.clone();
        leftKidney.position.set(-0.4, 0, 0);
        kidneyPair.add(leftKidney);
        
        const rightKidney = kidneyMesh.clone();
        rightKidney.rotation.y = Math.PI;
        rightKidney.position.set(0.4, 0, 0);
        kidneyPair.add(rightKidney);
        
        model = kidneyPair;
        break;
        
      case "eye":
        // Create a detailed eye
        const eyeGroup = new THREE.Group();
        
        // Eyeball
        const eyeball = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 32, 32),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.1,
          })
        );
        eyeGroup.add(eyeball);
        
        // Iris
        const iris = new THREE.Mesh(
          new THREE.CircleGeometry(0.2, 32),
          new THREE.MeshStandardMaterial({
            color: 0x6699cc,
            roughness: 0.5,
            metalness: 0.2,
          })
        );
        iris.position.set(0, 0, 0.5);
        eyeGroup.add(iris);
        
        // Pupil
        const pupil = new THREE.Mesh(
          new THREE.CircleGeometry(0.1, 32),
          new THREE.MeshBasicMaterial({
            color: 0x000000,
          })
        );
        pupil.position.set(0, 0, 0.51);
        eyeGroup.add(pupil);
        
        // Blood vessels
        for (let i = 0; i < 15; i++) {
          const startAngle = Math.random() * Math.PI * 2;
          const startRadius = 0.1 + Math.random() * 0.3;
          const endRadius = startRadius + 0.1 + Math.random() * 0.1;
          
          const curve = new THREE.CurvePath();
          const startX = Math.cos(startAngle) * startRadius;
          const startY = Math.sin(startAngle) * startRadius;
          const endX = Math.cos(startAngle) * endRadius;
          const endY = Math.sin(startAngle) * endRadius;
          
          const points = [
            new THREE.Vector3(startX, startY, 0.5),
            new THREE.Vector3(
              (startX + endX) / 2 + (Math.random() * 0.1 - 0.05),
              (startY + endY) / 2 + (Math.random() * 0.1 - 0.05),
              0.5
            ),
            new THREE.Vector3(endX, endY, 0.5)
          ];
          
          const vesselGeometry = new THREE.BufferGeometry().setFromPoints(points);
          const vesselMaterial = new THREE.LineBasicMaterial({ 
            color: 0xcc0000,
            linewidth: 1
          });
          const vessel = new THREE.Line(vesselGeometry, vesselMaterial);
          
          iris.add(vessel);
        }
        
        model = eyeGroup;
        break;
        
      default:
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        model = new THREE.Mesh(boxGeometry, boxMaterial);
    }

    // Add the model to the scene
    if (sceneRef.current) {
      sceneRef.current.add(model);
      modelRef.current = model;
      setIsLoading(false);
    }
  };

  // Toggle the rotation animation
  const toggleRotation = () => {
    setIsRotating(!isRotating);
  };

  // Functions for AR mode
  const onXRFrame = (time: any, frame: any) => {
    if (!frame || !xrSessionRef.current || !rendererRef.current || !sceneRef.current) return;
    
    const session = xrSessionRef.current;
    const referenceSpace = rendererRef.current.xr.getReferenceSpace();
    
    if (!referenceSpace) return;
    
    // Get hit test results
    if (hitTestSourceRef.current) {
      const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
      
      // If we have hit test results, update the reticle position
      if (hitTestResults.length > 0 && reticleRef.current) {
        const hitPose = hitTestResults[0].getPose(referenceSpace);
        if (hitPose) {
          reticleRef.current.visible = true;
          reticleRef.current.matrix.fromArray(hitPose.transform.matrix);
        }
      }
    }
    
    // Queue up the next frame
    session.requestAnimationFrame(onXRFrame);
  };

  const placeObject = (event: any) => {
    if (!reticleRef.current?.visible || !modelRef.current || !sceneRef.current) {
      // If reticle is not visible or there's no model, place the object 1m in front of the user
      if (modelRef.current && sceneRef.current) {
        const clone = modelRef.current.clone();
        clone.position.set(0, 0, -1); // 1m in front of the user
        clone.scale.set(0.2, 0.2, 0.2);
        sceneRef.current.add(clone);
      }
      return;
    }
    
    // Clone the model and place it at the reticle position
    const clone = modelRef.current.clone();
    clone.position.setFromMatrixPosition(reticleRef.current.matrix);
    clone.scale.set(0.2, 0.2, 0.2);
    sceneRef.current.add(clone);
  };

  // Enter AR mode
  const enterAR = async () => {
    if (!rendererRef.current || !sceneRef.current) return;

    try {
      const session = await navigator.xr?.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.getElementById('ar-overlay') }
      });

      xrSessionRef.current = session;
      setIsInXRSession(true);

      session.addEventListener('end', () => {
        setIsInXRSession(false);
        xrSessionRef.current = null;
        hitTestSourceRef.current = null;
        
        if (reticleRef.current) {
          reticleRef.current.visible = false;
        }
      });

      // Set up hit test source
      const viewerSpace = await session.requestReferenceSpace('viewer');
      hitTestSourceRef.current = await session.requestHitTestSource({
        space: viewerSpace
      });

      // Handle select events (taps)
      session.addEventListener('select', placeObject);

      // Set up render loop for AR
      rendererRef.current.xr.setReferenceSpaceType('local');
      rendererRef.current.xr.setSession(session);
      
      // Immediately place a model in front of the user
      setTimeout(() => {
        if (modelRef.current && sceneRef.current) {
          const clone = modelRef.current.clone();
          clone.position.set(0, 0, -1); // 1m in front of the user
          clone.scale.set(0.2, 0.2, 0.2);
          sceneRef.current.add(clone);
        }
      }, 500);
      
      session.requestAnimationFrame(onXRFrame);

      toast({
        title: "AR Mode Activated",
        description: "Look around to place the model in your environment",
      });
    } catch (error) {
      console.error('Error entering AR mode:', error);
      toast({
        variant: "destructive",
        title: "AR Mode Failed",
        description: "Could not initialize AR mode. Please try again.",
      });
    }
  };

  // Exit AR mode
  const exitAR = () => {
    if (xrSessionRef.current) {
      xrSessionRef.current.end();
    }
  };

  // Change the current model
  const changeModel = (newOrgan: OrganType) => {
    setCurrentOrgan(newOrgan);
    loadModel(newOrgan);
    if (onModelChange) {
      onModelChange(newOrgan);
    }
  };

  const modelButtons = [
    { type: 'heart' as OrganType, label: "Heart" },
    { type: 'brain' as OrganType, label: "Brain" },
    { type: 'lungs' as OrganType, label: "Lungs" },
    { type: 'kidney' as OrganType, label: "Kidney" },
    { type: 'eye' as OrganType, label: "Eye" },
  ];

  return (
    <div className={cn("relative w-full h-full flex flex-col", className)}>
      {/* AR Mode Overlay */}
      <div id="ar-overlay" className={cn(
        "absolute top-0 left-0 w-full z-10 flex justify-between items-center p-4",
        "bg-gradient-to-b from-black/30 to-transparent",
        {"hidden": !isInXRSession}
      )}>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-white hover:bg-white/20 hover:text-white"
          onClick={exitAR}
        >
          <X className="mr-2 h-4 w-4" /> Exit AR
        </Button>
      </div>
      
      {/* 3D Viewer */}
      <div 
        ref={containerRef} 
        className="relative flex-1 w-full overflow-hidden rounded-lg bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        style={{ minHeight: "300px" }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 z-10">
            <Loader className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 border-t rounded-b-lg">
        {/* Model Selection */}
        <div className="flex flex-wrap gap-2">
          {modelButtons.map((button) => (
            <Button
              key={button.type}
              variant={currentOrgan === button.type ? "default" : "outline"}
              size="sm"
              onClick={() => changeModel(button.type)}
              className={cn(
                "transition-all",
                currentOrgan === button.type && "bg-pink-600 hover:bg-pink-700"
              )}
            >
              {button.label}
            </Button>
          ))}
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleRotation}
            className={cn(isRotating && "text-pink-600")}
          >
            <RotateCcw className={cn("h-4 w-4 mr-1", isRotating && "animate-spin")} />
            {isRotating ? "Stop" : "Rotate"}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={enterAR}
            disabled={!isXRAvailable || isInXRSession}
            className={cn(
              "bg-pink-600 hover:bg-pink-700",
              (!isXRAvailable || isInXRSession) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Eye className="h-4 w-4 mr-1" />
            View in AR
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThreeDViewer;
