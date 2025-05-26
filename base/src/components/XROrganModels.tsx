
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  Link, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Volume2,
  Settings,
  User
} from 'lucide-react';

interface OrganModel {
  id: string;
  label: string;
  url: string;
  description: string;
  parts: string[];
}

interface XROrganModelsProps {
  onLinkToPatient?: (modelId: string, patientId: string) => void;
  patients?: Array<{ id: string; name: string }>;
  className?: string;
}

const organModels: OrganModel[] = [
  {
    id: 'animal_cell',
    label: 'Animal Cell',
    url: 'https://www.body3d.eu/3D/Zelle/',
    description: 'Interactive 3D model of an animal cell with organelles',
    parts: ['Nucleus', 'Mitochondria', 'Ribosomes', 'Endoplasmic Reticulum', 'Golgi Apparatus']
  },
  {
    id: 'upper_abdomen',
    label: 'Upper Abdomen',
    url: 'https://www.body3d.eu/3D/Oberbauch/',
    description: 'Detailed view of upper abdominal organs',
    parts: ['Liver', 'Stomach', 'Pancreas', 'Gallbladder', 'Spleen']
  },
  {
    id: 'human_eye',
    label: 'Human Eye Cross Section',
    url: 'https://www.body3d.eu/3D/Auge/',
    description: 'Cross-sectional anatomy of the human eye',
    parts: ['Cornea', 'Lens', 'Retina', 'Optic Nerve', 'Iris', 'Pupil']
  },
  {
    id: 'full_abdomen',
    label: 'Full Abdomen',
    url: 'https://www.body3d.eu/3D/Magendarmtrakt/',
    description: 'Complete digestive system and abdominal organs',
    parts: ['Stomach', 'Small Intestine', 'Large Intestine', 'Liver', 'Pancreas', 'Kidneys']
  }
];

const XROrganModels: React.FC<XROrganModelsProps> = ({
  onLinkToPatient,
  patients = [],
  className = ''
}) => {
  const [selectedModel, setSelectedModel] = useState<OrganModel>(organModels[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isXRActive, setIsXRActive] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleModelChange = (modelId: string) => {
    const model = organModels.find(m => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      toast({
        title: "Model Changed",
        description: `Switched to ${model.label}`,
      });
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (iframeRef.current?.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const activateXR = async () => {
    try {
      // Check for WebXR support
      if (!navigator.xr) {
        toast({
          title: "WebXR Not Supported",
          description: "Your browser doesn't support WebXR. Try Chrome or Edge on a compatible device.",
          variant: "destructive"
        });
        return;
      }

      // Check for immersive VR support
      const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
      
      if (isSupported) {
        setIsXRActive(true);
        toast({
          title: "XR Mode Activated",
          description: `${selectedModel.label} is now available in immersive mode`,
        });
        
        // Post message to iframe to activate XR if supported
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ action: 'activateXR' }, '*');
        }
      } else {
        toast({
          title: "XR Not Available",
          description: "Immersive VR is not available on this device",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('XR activation failed:', error);
      toast({
        title: "XR Error",
        description: "Failed to activate XR mode",
        variant: "destructive"
      });
    }
  };

  const linkToPatient = () => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient to link this model to",
        variant: "destructive"
      });
      return;
    }

    if (onLinkToPatient) {
      onLinkToPatient(selectedModel.id, selectedPatient);
      toast({
        title: "Model Linked",
        description: `${selectedModel.label} linked to patient record`,
      });
    }
  };

  const resetView = () => {
    setZoom(100);
    setRotation({ x: 0, y: 0, z: 0 });
    
    // Post message to iframe to reset view
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        action: 'resetView',
        zoom: 100,
        rotation: { x: 0, y: 0, z: 0 }
      }, '*');
    }
    
    toast({
      title: "View Reset",
      description: "Model view has been reset to default",
    });
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.max(50, Math.min(200, zoom + delta));
    setZoom(newZoom);
    
    // Post message to iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        action: 'setZoom',
        zoom: newZoom
      }, '*');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Model Selection and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>XR-Compatible 3D Organ Models</span>
            <div className="flex gap-2">
              {isXRActive && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  XR Active
                </Badge>
              )}
              <Badge variant="outline">WebXR Ready</Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Interactive 3D anatomical models with immersive XR capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Model Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Model</label>
              <Select value={selectedModel.id} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an organ model" />
                </SelectTrigger>
                <SelectContent>
                  {organModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Patient Linking */}
            <div>
              <label className="text-sm font-medium mb-2 block">Link to Patient</label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zoom Control */}
            <div>
              <label className="text-sm font-medium mb-2 block">Zoom Level</label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustZoom(-10)}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono w-12 text-center">{zoom}%</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => adjustZoom(10)}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={activateXR} variant="default">
              <Eye className="h-4 w-4 mr-2" />
              Open in WebXR
            </Button>
            
            <Button onClick={toggleFullscreen} variant="outline">
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expand Fullscreen
                </>
              )}
            </Button>
            
            <Button onClick={resetView} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
            
            <Button onClick={linkToPatient} variant="outline" disabled={!selectedPatient}>
              <Link className="h-4 w-4 mr-2" />
              Link to Patient
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3D Model Viewer */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{selectedModel.label}</CardTitle>
              <CardDescription>{selectedModel.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Interactive</Badge>
              <Badge variant="outline">3D</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <iframe
              ref={iframeRef}
              src={selectedModel.url}
              className={`w-full border-0 transition-all duration-300 ${
                isFullscreen ? 'h-screen' : 'h-[500px]'
              }`}
              title={selectedModel.label}
              allow="xr-spatial-tracking; fullscreen"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
            />
            
            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => {
                  // Toggle model information
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anatomical Parts</CardTitle>
          <CardDescription>
            Visible components in the {selectedModel.label} model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedModel.parts.map((part, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  toast({
                    title: "Part Focus",
                    description: `Focusing on ${part}`,
                  });
                }}
              >
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm font-medium">{part}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default XROrganModels;
