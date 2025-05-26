import React, { useState, useEffect } from 'react';
import { usePatientRecords, PatientRecord, VitalReading } from '@/hooks/usePatientRecords';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Heart, 
  Brain, 
  Activity, 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  AlertTriangle,
  Shield,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import PatientProfileForm from './PatientProfileForm';
import XROrganModels from './XROrganModels';
import MedicalNFTMinter from './MedicalNFTMinter';
import StarknetWalletConnector from './blockchain/StarknetWalletConnector';
import { useTelemetryPatient } from '@/hooks/useTelemetryPatient';
import { Patient, MedicalScan, ActivityEntry } from '@/utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

interface PatientRecordsProps {
  className?: string;
}

const PatientRecords: React.FC<PatientRecordsProps> = ({ className }) => {
  const { patientRecords, addPatient, updatePatient, deletePatient } = usePatientRecords();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('records');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrgan, setFilterOrgan] = useState('');
  const [filterDiagnosis, setFilterDiagnosis] = useState('');
  
  const { 
    selectedPatient,
    vitalHistory,
    isConnected,
    connectTelemetry,
    disconnectTelemetry
  } = useTelemetryPatient(selectedPatientId);

  const selectedPatientData = patientRecords.find(p => p.id === selectedPatientId) as Patient | undefined;

  // Filter patients based on search and filters
  const filteredPatients = patientRecords.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.zkIdentityHash && patient.zkIdentityHash.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesOrgan = !filterOrgan || 
                        patient.scansAndImages?.some(scan => scan.organ.toLowerCase().includes(filterOrgan.toLowerCase()));
    
    const matchesDiagnosis = !filterDiagnosis || 
                            patient.condition.toLowerCase().includes(filterDiagnosis.toLowerCase()) ||
                            patient.diagnosis.toLowerCase().includes(filterDiagnosis.toLowerCase());

    return matchesSearch && matchesOrgan && matchesDiagnosis;
  });

  const handleAddPatient = () => {
    setIsAddingPatient(true);
    setIsEditingPatient(false);
  };
  
  const handleEditPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setIsEditingPatient(true);
    setIsAddingPatient(false);
  };
  
  const handleSubmitPatient = (patientData: Omit<Patient, 'blockchainStatus'>) => {
    try {
      const finalPatientData: Patient = {
        ...patientData,
        blockchainStatus: 'pending',
        admissionDate: patientData.admissionDate || new Date().toISOString().split('T')[0]
      };
      
      if (isAddingPatient) {
        addPatient(finalPatientData);
        setIsAddingPatient(false);
      } else if (isEditingPatient) {
        updatePatient(patientData.id, finalPatientData);
        setIsEditingPatient(false);
      }
      
    } catch (error) {
      console.error("Error submitting patient:", error);
      toast({
        title: "Error",
        description: "Failed to save patient data",
        variant: "destructive"
      });
    }
  };
  
  const handleCancelEdit = () => {
    setIsAddingPatient(false);
    setIsEditingPatient(false);
  };
  
  const handleDeletePatient = (patientId: string) => {
    if (window.confirm("Are you sure you want to delete this patient record? This action cannot be undone.")) {
      deletePatient(patientId);
      if (selectedPatientId === patientId) {
        setSelectedPatientId(null);
      }
    }
  };

  const handleScanUploaded = (scan: MedicalScan) => {
    if (!selectedPatientData) return;
    
    const updatedScans = [...(selectedPatientData.scansAndImages || []), scan];
    const newActivity: ActivityEntry = {
      id: uuidv4(),
      type: scan.nftTokenId ? 'nft_minted' : 'scan_uploaded',
      timestamp: new Date().toISOString(),
      description: scan.nftTokenId ? 
        `NFT minted for ${scan.scanType} scan` : 
        `${scan.scanType} scan uploaded`,
      txHash: scan.txHash,
      details: { scanId: scan.id, organ: scan.organ }
    };
    
    const updatedActivityFeed = [...(selectedPatientData.activityFeed || []), newActivity];
    
    updatePatient(selectedPatientData.id, {
      scansAndImages: updatedScans,
      activityFeed: updatedActivityFeed
    });
  };

  const handleLinkXRModel = (modelId: string, patientId: string) => {
    const patient = patientRecords.find(p => p.id === patientId);
    if (!patient) return;
    
    const newActivity: ActivityEntry = {
      id: uuidv4(),
      type: 'xr_viewed',
      timestamp: new Date().toISOString(),
      description: `XR model ${modelId} linked to patient record`,
      details: { modelId }
    };
    
    const updatedActivityFeed = [...(patient.activityFeed || []), newActivity];
    updatePatient(patientId, { activityFeed: updatedActivityFeed });
    
    toast({
      title: "XR Model Linked",
      description: `3D model linked to ${patient.name}'s record`,
    });
  };

  const exportPatientData = (format: 'json' | 'pdf') => {
    if (!selectedPatientData) return;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(selectedPatientData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedPatientData.name}_medical_record.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    toast({
      title: "Export Complete",
      description: `Patient data exported as ${format.toUpperCase()}`,
    });
  };

  const formatVitalSigns = (reading: VitalReading) => {
    return {
      heartRate: `${reading.heartRate} bpm`,
      bloodPressure: `${reading.bloodPressure} mmHg`,
      oxygenLevel: `${reading.oxygenLevel}%`,
      temperature: `${reading.temperature}°C`,
      respirationRate: `${reading.respirationRate} bpm`,
      timestamp: new Date(reading.timestamp).toLocaleString()
    };
  };
  
  const getHealthStatus = (reading: VitalReading) => {
    if (reading.heartRate > 100 || reading.heartRate < 60) {
      return 'critical';
    }
    if (reading.oxygenLevel < 95) {
      return 'warning';
    }
    if (reading.temperature > 37.5) {
      return 'warning';
    }
    return 'normal';
  };

  return (
    <div className={`w-full animate-fade-in ${className}`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-1/3 space-y-6">
          {/* Wallet Connection */}
          <StarknetWalletConnector />
          
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Input
                  placeholder="Search by name, ID, or ZK hash..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Filter by organ..."
                  value={filterOrgan}
                  onChange={(e) => setFilterOrgan(e.target.value)}
                />
                <Input
                  placeholder="Filter by diagnosis..."
                  value={filterDiagnosis}
                  onChange={(e) => setFilterDiagnosis(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Patient List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Patient Records</span>
                <Button 
                  onClick={handleAddPatient}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Patient</span>
                </Button>
              </CardTitle>
              <CardDescription>
                {filteredPatients.length} of {patientRecords.length} patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAddingPatient || isEditingPatient ? (
                <div className="p-4 border rounded-lg">
                  <PatientProfileForm
                    onSubmit={handleSubmitPatient}
                    initialData={isEditingPatient ? selectedPatientData : undefined}
                    isEditing={isEditingPatient}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center p-4 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        {patientRecords.length === 0 ? 'No patient records found' : 'No patients match your search'}
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={handleAddPatient}
                      >
                        Add Your First Patient
                      </Button>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div 
                        key={patient.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPatientId === patient.id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {patient.age} years • {patient.gender} • {patient.condition}
                            </p>
                            
                            {/* ZK Identity Badge */}
                            {patient.zkIdentityHash && (
                              <div className="flex items-center gap-1 mt-1">
                                <Shield className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-600">ZK Verified</span>
                              </div>
                            )}
                            
                            {/* NFT Count */}
                            {patient.scansAndImages && patient.scansAndImages.length > 0 && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {patient.scansAndImages.filter(scan => scan.nftTokenId).length} NFTs
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPatient(patient as Patient);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePatient(patient.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="lg:w-2/3">
          {selectedPatientData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedPatientData.name}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportPatientData('json')}>
                      <Download className="h-4 w-4 mr-1" />
                      Export JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportPatientData('pdf')}>
                      <Download className="h-4 w-4 mr-1" />
                      Export PDF
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Patient ID: {selectedPatientData.id} • 
                  {selectedPatientData.zkIdentityHash && (
                    <span className="text-green-600 ml-2">✓ ZK Verified</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-6 mb-4">
                    <TabsTrigger value="records">
                      <FileText className="h-4 w-4 mr-2" />
                      Records
                    </TabsTrigger>
                    <TabsTrigger value="scans">
                      <Brain className="h-4 w-4 mr-2" />
                      Scans & NFTs
                    </TabsTrigger>
                    <TabsTrigger value="xr-models">
                      <Eye className="h-4 w-4 mr-2" />
                      XR Models
                    </TabsTrigger>
                    <TabsTrigger value="vitals">
                      <Activity className="h-4 w-4 mr-2" />
                      Vitals
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                      <Heart className="h-4 w-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="consent">
                      <Shield className="h-4 w-4 mr-2" />
                      Consent
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Keep existing tab content for records and vitals */}
                  <TabsContent value="records" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Age</p>
                        <p>{selectedPatientData.age} years</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Gender</p>
                        <p>{selectedPatientData.gender}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Medical Condition</p>
                        <p>{selectedPatientData.condition}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Attending Physician</p>
                        <p>{selectedPatientData.doctor || 'Not assigned'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Blockchain Status</p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            selectedPatientData.blockchainStatus === 'verified' 
                              ? 'bg-emerald-500' 
                              : selectedPatientData.blockchainStatus === 'pending'
                                ? 'bg-amber-500'
                                : 'bg-destructive'
                          }`}></span>
                          <span className="capitalize">{selectedPatientData.blockchainStatus}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Last Updated</p>
                        <p>{selectedPatientData.vitalSigns 
                          ? new Date(selectedPatientData.vitalSigns.timestamp).toLocaleString() 
                          : 'No data'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Notes</h3>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-muted-foreground italic">
                          {selectedPatientData.condition === 'Cardiac Arrhythmia' 
                            ? 'Patient presents with irregular heartbeat patterns. Monitoring required.' 
                            : selectedPatientData.condition === 'Pneumonia'
                              ? 'Lung infection detected. Prescribed antibiotics and rest.'
                              : 'No additional notes available for this patient.'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="vitals" className="space-y-4">
                    {selectedPatientData.vitalSigns ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <Card className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">Heart Rate</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className={`text-2xl font-bold ${
                                selectedPatientData.vitalSigns.heartRate > 100 || selectedPatientData.vitalSigns.heartRate < 60
                                  ? 'text-destructive'
                                  : 'text-emerald-500'
                              }`}>
                                {selectedPatientData.vitalSigns.heartRate} <span className="text-sm font-normal">bpm</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Normal range: 60-100 bpm</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">Blood Pressure</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className={`text-2xl font-bold ${
                                selectedPatientData.vitalSigns.bloodPressure > 140
                                  ? 'text-destructive'
                                  : selectedPatientData.vitalSigns.bloodPressure > 130
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                              }`}>
                                {selectedPatientData.vitalSigns.bloodPressure} <span className="text-sm font-normal">mmHg</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Normal range: 90-120 mmHg</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">Oxygen Level</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className={`text-2xl font-bold ${
                                selectedPatientData.vitalSigns.oxygenLevel < 95
                                  ? 'text-destructive'
                                  : selectedPatientData.vitalSigns.oxygenLevel < 97
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                              }`}>
                                {selectedPatientData.vitalSigns.oxygenLevel}%
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Normal range: 95-100%</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">Temperature</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className={`text-2xl font-bold ${
                                selectedPatientData.vitalSigns.temperature > 37.5
                                  ? 'text-destructive'
                                  : selectedPatientData.vitalSigns.temperature > 37.2
                                    ? 'text-amber-500'
                                    : 'text-emerald-500'
                              }`}>
                                {selectedPatientData.vitalSigns.temperature}°C
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Normal range: 36.5-37.2°C</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">Respiration Rate</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className={`text-2xl font-bold ${
                                selectedPatientData.vitalSigns.respirationRate > 20 || selectedPatientData.vitalSigns.respirationRate < 12
                                  ? 'text-amber-500'
                                  : 'text-emerald-500'
                              }`}>
                                {selectedPatientData.vitalSigns.respirationRate} <span className="text-sm font-normal">bpm</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Normal range: 12-20 bpm</p>
                            </CardContent>
                          </Card>
                          
                          <Card className="overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                              <CardTitle className="text-base">Last Updated</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="text-base font-medium">
                                {new Date(selectedPatientData.vitalSigns.timestamp).toLocaleTimeString()}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(selectedPatientData.vitalSigns.timestamp).toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-2">Vital Signs History</h3>
                          {vitalHistory.length > 1 ? (
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="p-2 text-left">Time</th>
                                    <th className="p-2 text-left">Heart Rate</th>
                                    <th className="p-2 text-left">Blood Pressure</th>
                                    <th className="p-2 text-left">Oxygen</th>
                                    <th className="p-2 text-left">Temp</th>
                                    <th className="p-2 text-left">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vitalHistory.slice().reverse().map((reading, index) => {
                                    const formatted = formatVitalSigns(reading);
                                    const status = getHealthStatus(reading);
                                    
                                    return (
                                      <tr key={index} className="border-t">
                                        <td className="p-2 text-sm">{formatted.timestamp}</td>
                                        <td className="p-2 text-sm">{formatted.heartRate}</td>
                                        <td className="p-2 text-sm">{formatted.bloodPressure}</td>
                                        <td className="p-2 text-sm">{formatted.oxygenLevel}</td>
                                        <td className="p-2 text-sm">{formatted.temperature}</td>
                                        <td className="p-2">
                                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                            status === 'critical' 
                                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                              : status === 'warning'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          }`}>
                                            {status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No historical data available yet.</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-8 border border-dashed rounded-lg">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-lg font-medium">No Vital Signs Data</h3>
                        <p className="text-muted-foreground mb-4">
                          This patient doesn't have any vital signs recorded yet.
                        </p>
                        <Button onClick={() => setActiveTab('telemetry')}>
                          Connect to Monitor
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* New Scans & NFTs Tab */}
                  <TabsContent value="scans" className="space-y-6">
                    <MedicalNFTMinter
                      patientId={selectedPatientData.id}
                      patientName={selectedPatientData.name}
                      onScanUploaded={handleScanUploaded}
                    />
                    
                    {/* Existing Scans List */}
                    {selectedPatientData.scansAndImages && selectedPatientData.scansAndImages.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Uploaded Scans</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-4">
                            {selectedPatientData.scansAndImages.map((scan) => (
                              <div key={scan.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                {scan.thumbnailUrl && (
                                  <img 
                                    src={scan.thumbnailUrl} 
                                    alt={scan.filename}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium">{scan.filename}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {scan.scanType} • {scan.organ} • {new Date(scan.uploadDate).toLocaleDateString()}
                                  </p>
                                  {scan.nftTokenId && (
                                    <Badge variant="secondary" className="mt-1">
                                      NFT: {scan.nftTokenId.substring(0, 16)}...
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  
                  {/* XR Models Tab */}
                  <TabsContent value="xr-models">
                    <XROrganModels
                      onLinkToPatient={handleLinkXRModel}
                      patients={patientRecords.map(p => ({ id: p.id, name: p.name }))}
                    />
                  </TabsContent>
                  
                  {/* Activity Feed Tab */}
                  <TabsContent value="activity" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Activity Feed</CardTitle>
                        <CardDescription>Recent activities for this patient</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedPatientData.activityFeed && selectedPatientData.activityFeed.length > 0 ? (
                          <div className="space-y-3">
                            {selectedPatientData.activityFeed.slice().reverse().map((activity) => (
                              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium">{activity.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </p>
                                  {activity.txHash && (
                                    <p className="text-xs font-mono text-muted-foreground mt-1">
                                      Tx: {activity.txHash.substring(0, 16)}...
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline">{activity.type.replace('_', ' ')}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-8">
                            No activity recorded yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  {/* Consent Tab */}
                  <TabsContent value="consent" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Consent Management</CardTitle>
                        <CardDescription>Control how patient data can be accessed and shared</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">Allow Medical Scan Viewing</h4>
                              <p className="text-sm text-muted-foreground">
                                Permit healthcare providers to view uploaded medical scans
                              </p>
                            </div>
                            <Badge variant={selectedPatientData.consentEnabled ? "default" : "secondary"}>
                              {selectedPatientData.consentEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          
                          <Button 
                            onClick={() => {
                              const newConsent = !selectedPatientData.consentEnabled;
                              updatePatient(selectedPatientData.id, { consentEnabled: newConsent });
                              
                              const newActivity: ActivityEntry = {
                                id: uuidv4(),
                                type: 'consent_toggled',
                                timestamp: new Date().toISOString(),
                                description: `Data consent ${newConsent ? 'enabled' : 'disabled'}`,
                                details: { consentEnabled: newConsent }
                              };
                              
                              const updatedActivityFeed = [...(selectedPatientData.activityFeed || []), newActivity];
                              updatePatient(selectedPatientData.id, { activityFeed: updatedActivityFeed });
                            }}
                            variant={selectedPatientData.consentEnabled ? "destructive" : "default"}
                          >
                            {selectedPatientData.consentEnabled ? "Disable Consent" : "Enable Consent"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center border rounded-lg p-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-xl font-medium">No Patient Selected</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Select a patient from the list to view their complete medical profile with ZK identity, 
                  3D XR models, and NFT scans.
                </p>
                <Button onClick={handleAddPatient}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Patient
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRecords;
