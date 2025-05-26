
import Layout from '@/components/Layout';
import PatientRecords from '@/components/PatientRecords';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileImage, UserPlus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { loadPatientData, savePatientData, Patient, MedicalScan } from '@/utils/localStorage';
import { useAppStore } from '@/stores/appStore';
import PatientForm from '@/components/forms/PatientForm';
import ScanUploadForm from '@/components/scan/ScanUploadForm';
import { toast } from '@/hooks/use-toast';

const Records = () => {
  const [activeTab, setActiveTab] = useState<string>("records");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allScans, setAllScans] = useState<MedicalScan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModality, setFilterModality] = useState('all');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showScanUpload, setShowScanUpload] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const { setActivePatient } = useAppStore();

  useEffect(() => {
    const patientData = loadPatientData();
    setPatients(patientData);
    
    const scans = patientData.flatMap(patient => patient.scansAndImages || []);
    setAllScans(scans);
  }, []);

  const filteredScans = allScans.filter(scan => {
    const matchesSearch = searchTerm === '' || 
      scan.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.organ.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.scanType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModality = filterModality === 'all' || scan.scanType === filterModality;
    
    return matchesSearch && matchesModality;
  });

  const handlePatientSubmit = (patientData: Patient) => {
    const updatedPatients = editingPatient 
      ? patients.map(p => p.id === editingPatient.id ? patientData : p)
      : [...patients, patientData];
    
    setPatients(updatedPatients);
    savePatientData(updatedPatients);
    setShowPatientForm(false);
    setEditingPatient(undefined);
    
    // Set as active patient for cross-page navigation
    setActivePatient(patientData);
    
    toast({
      title: editingPatient ? "Patient Updated" : "Patient Created",
      description: `${patientData.name} has been ${editingPatient ? 'updated' : 'added to'} records`
    });
  };

  const handleScanUpload = (scan: MedicalScan) => {
    // Find the patient and add the scan
    const updatedPatients = patients.map(patient => {
      if (patient.id === scan.metadata.timestamp) { // Using timestamp as patient identifier for now
        return {
          ...patient,
          scansAndImages: [...(patient.scansAndImages || []), scan]
        };
      }
      return patient;
    });
    
    setPatients(updatedPatients);
    savePatientData(updatedPatients);
    setAllScans([...allScans, scan]);
    setShowScanUpload(false);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
  };

  const handleDeletePatient = (patientId: string) => {
    const updatedPatients = patients.filter(p => p.id !== patientId);
    setPatients(updatedPatients);
    savePatientData(updatedPatients);
    
    toast({
      title: "Patient Removed",
      description: "Patient has been removed from records"
    });
  };

  const getPatientNameForScan = (scan: MedicalScan) => {
    // Find patient by matching scan to patient's scans
    const patient = patients.find(p => 
      p.scansAndImages?.some(s => s.id === scan.id)
    );
    return patient?.name || 'Unknown Patient';
  };

  return (
    <Layout>
      <PageHeader
        title="Medical Records"
        description="Comprehensive patient records and medical imaging management with blockchain verification"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Search className="h-3 w-3" />
              {patients.length} patients
            </Badge>
            <Button onClick={() => setShowPatientForm(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Patient
            </Button>
          </div>
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8 w-full max-w-md">
          <TabsTrigger value="records">Patient Records</TabsTrigger>
          <TabsTrigger value="scans">Scans & Imaging</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records" className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <PatientRecords />
        </TabsContent>
        
        <TabsContent value="scans" className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filterModality}
                onChange={(e) => setFilterModality(e.target.value)}
              >
                <option value="all">All Modalities</option>
                <option value="CT">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="X-Ray">X-Ray</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="PET">PET Scan</option>
              </select>
              
              <Badge variant="outline">
                {filteredScans.length} scan{filteredScans.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <Button onClick={() => setShowScanUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Scans
            </Button>
          </div>

          {filteredScans.length === 0 ? (
            <Card className="p-12 text-center">
              <FileImage className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-xl font-medium mb-2">No Scans Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterModality !== 'all' 
                  ? 'No scans match your search criteria'
                  : 'Upload medical scans to get started'
                }
              </p>
              <Button onClick={() => setShowScanUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Scan
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScans.map((scan) => (
                <Card key={scan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {scan.thumbnailUrl ? (
                      <img 
                        src={scan.thumbnailUrl} 
                        alt={scan.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{scan.filename}</h3>
                      <Badge variant="secondary">{scan.scanType}</Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Patient: {getPatientNameForScan(scan)}</div>
                      <div>Organ: {scan.organ}</div>
                      <div>Date: {new Date(scan.uploadDate).toLocaleDateString()}</div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        Mint NFT
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{patients.length}</div>
              <div className="text-sm text-muted-foreground">Total Patients</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold">{allScans.length}</div>
              <div className="text-sm text-muted-foreground">Total Scans</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {patients.filter(p => p.zkIdentityHash).length}
              </div>
              <div className="text-sm text-muted-foreground">ZK Protected</div>
            </Card>
            
            <Card className="p-4">
              <div className="text-2xl font-bold">
                {allScans.filter(s => s.nftTokenId).length}
              </div>
              <div className="text-sm text-muted-foreground">Minted NFTs</div>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest patient records and scan uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patients.slice(0, 5).map(patient => (
                  <div key={patient.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {patient.condition} • Added {new Date(patient.admissionDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={patient.zkIdentityHash ? "default" : "outline"}>
                      {patient.zkIdentityHash ? 'ZK Protected' : 'Standard'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Form Dialog */}
      <Dialog open={showPatientForm} onOpenChange={setShowPatientForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? 'Edit Patient' : 'Add New Patient'}
            </DialogTitle>
          </DialogHeader>
          <PatientForm
            patient={editingPatient}
            onSubmit={handlePatientSubmit}
            onCancel={() => {
              setShowPatientForm(false);
              setEditingPatient(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Scan Upload Dialog */}
      <Dialog open={showScanUpload} onOpenChange={setShowScanUpload}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Medical Scans</DialogTitle>
          </DialogHeader>
          <ScanUploadForm
            patients={patients}
            onUploadComplete={handleScanUpload}
            onCancel={() => setShowScanUpload(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Records;
