
import { useState } from 'react';
import Layout from '@/components/Layout';
import XROrganModels from '@/components/XROrganModels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Heart, Wind, Eye, Droplet, Box, RefreshCw, Maximize2, Link } from 'lucide-react';
import { loadPatientData } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Models = () => {
  const [selectedCategory, setSelectedCategory] = useState('anatomy');
  const [patients] = useState(() => loadPatientData());

  const modelCategories = {
    anatomy: {
      title: "Anatomical Models",
      description: "Interactive 3D models of human anatomy with XR capabilities",
      models: [
        {
          id: 'animal_cell',
          title: "Animal Cell",
          description: "Detailed cellular structure with organelles",
          icon: Droplet,
          complexity: "Basic"
        },
        {
          id: 'human_eye',
          title: "Human Eye",
          description: "Cross-sectional view of eye anatomy",
          icon: Eye,
          complexity: "Intermediate"
        },
        {
          id: 'upper_abdomen',
          title: "Upper Abdomen",
          description: "Liver, stomach, and surrounding organs",
          icon: Heart,
          complexity: "Advanced"
        },
        {
          id: 'full_abdomen',
          title: "Full Abdomen",
          description: "Complete digestive system",
          icon: Wind,
          complexity: "Advanced"
        }
      ]
    },
    pathology: {
      title: "Pathological Models",
      description: "Disease states and abnormal conditions",
      models: [
        {
          id: 'tumor_brain',
          title: "Brain Tumor",
          description: "Tumor growth in brain tissue",
          icon: Brain,
          complexity: "Advanced"
        },
        {
          id: 'fracture_bone',
          title: "Bone Fracture",
          description: "Various types of bone fractures",
          icon: Box,
          complexity: "Intermediate"
        }
      ]
    },
    diagnostic: {
      title: "Diagnostic Tools",
      description: "Interactive diagnostic and measurement tools",
      models: [
        {
          id: 'measurement_tool',
          title: "Measurement Tool",
          description: "Precise anatomical measurements",
          icon: RefreshCw,
          complexity: "Basic"
        }
      ]
    }
  };

  const handleLinkToPatient = (modelId: string, patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
      toast({
        title: "Model Linked",
        description: `3D model linked to ${patient.name}'s record`,
      });
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">3D Medical Models</h1>
        <p className="text-muted-foreground">
          Explore detailed anatomical models with AR/VR capabilities and patient record integration
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-1">

        
        {/* Main Content */}
        <div className="lg:col-span-6">
          <Tabs value="viewer" className="w-full">
   
            
            <TabsContent value="viewer" className="animate-fade-in">
              <Card>
       
                <CardContent className="p-0">
                  <XROrganModels
                    onLinkToPatient={handleLinkToPatient}
                    patients={patients.map(p => ({ id: p.id, name: p.name }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="gallery" className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modelCategories[selectedCategory as keyof typeof modelCategories].models.map((model) => {
                  const IconComponent = model.icon;
                  return (
                    <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <IconComponent className="h-8 w-8 text-primary" />
                          <Badge variant={
                            model.complexity === 'Basic' ? 'secondary' :
                            model.complexity === 'Intermediate' ? 'default' : 'destructive'
                          }>
                            {model.complexity}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{model.title}</CardTitle>
                        <CardDescription>{model.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <Button className="w-full" size="sm">
                            <Maximize2 className="h-4 w-4 mr-2" />
                            Load in 3D Viewer
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-1" />
                              AR Mode
                            </Button>
                  
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Models;
