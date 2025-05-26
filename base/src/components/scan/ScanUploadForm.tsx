
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, X, CheckCircle, AlertCircle } from 'lucide-react';
import { MedicalScan, Patient } from '@/utils/localStorage';
import { starknetService } from '@/services/starknetService';
import { toast } from '@/hooks/use-toast';

interface ScanUploadFormProps {
  patients: Patient[];
  onUploadComplete: (scan: MedicalScan) => void;
  onCancel: () => void;
}

const ScanUploadForm = ({ patients, onUploadComplete, onCancel }: ScanUploadFormProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    scanType: '',
    organ: '',
    notes: '',
    tags: '',
    modality: '',
    bodyPart: ''
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/dicom': ['.dcm', '.dicom'],
      'application/octet-stream': ['.dcm']
    },
    maxSize: 50 * 1024 * 1024 // 50MB limit
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !formData.patientId || !formData.scanType) {
      toast({
        title: "Missing Information",
        description: "Please select files, patient, and scan type",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress((i / selectedFiles.length) * 100);

        // Upload to IPFS
        const ipfsHash = await starknetService.uploadToIPFS(file);
        
        // Determine file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let fileType: 'jpg' | 'png' | 'dicom' | 'dcm' = 'jpg';
        
        if (fileExtension === 'png') fileType = 'png';
        else if (fileExtension === 'dcm' || fileExtension === 'dicom') fileType = 'dcm';
        else if (fileExtension === 'jpg' || fileExtension === 'jpeg') fileType = 'jpg';

        const scan: MedicalScan = {
          id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          type: fileType,
          scanType: formData.scanType,
          organ: formData.organ,
          uploadDate: new Date().toISOString(),
          doctor: 'Current User', // TODO: Get from auth context
          metadata: {
            diagnosisSummary: '',
            notes: formData.notes,
            medicalTags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            timestamp: new Date().toISOString(),
            scanDate: new Date().toISOString()
          },
          ipfsHash,
          thumbnailUrl: URL.createObjectURL(file)
        };

        onUploadComplete(scan);
      }

      setUploadProgress(100);
      
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${selectedFiles.length} scan(s)`
      });

      // Reset form
      setSelectedFiles([]);
      setFormData({
        patientId: '',
        scanType: '',
        organ: '',
        notes: '',
        tags: '',
        modality: '',
        bodyPart: ''
      });

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload scans. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Medical Scans</CardTitle>
          <CardDescription>
            Upload CT, MRI, X-ray, ultrasound, or other medical imaging files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg mb-2">Drag & drop medical scan files here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports JPG, PNG, DICOM (.dcm) files up to 50MB
                </p>
                <Button variant="outline">Browse Files</Button>
              </div>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Upload Progress</Label>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Metadata</CardTitle>
          <CardDescription>
            Provide details about the medical scans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select 
                value={formData.patientId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - {patient.condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scan Type *</Label>
              <Select 
                value={formData.scanType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, scanType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CT">CT Scan</SelectItem>
                  <SelectItem value="MRI">MRI</SelectItem>
                  <SelectItem value="X-Ray">X-Ray</SelectItem>
                  <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                  <SelectItem value="PET">PET Scan</SelectItem>
                  <SelectItem value="Nuclear">Nuclear Medicine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Body Part/Organ</Label>
              <Input
                value={formData.organ}
                onChange={(e) => setFormData(prev => ({ ...prev, organ: e.target.value }))}
                placeholder="e.g., Brain, Heart, Lungs"
              />
            </div>

            <div className="space-y-2">
              <Label>Medical Tags</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="comma, separated, tags"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Clinical Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the scan"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Scan(s)`}
        </Button>
      </div>
    </div>
  );
};

export default ScanUploadForm;
