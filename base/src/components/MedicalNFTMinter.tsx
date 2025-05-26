
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Coins, 
  Loader2, 
  CheckCircle, 
  ExternalLink,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { starknetService } from '@/services/starknetService';
import { MedicalScan, ScanMetadata } from '@/utils/localStorage';

interface MedicalNFTMinterProps {
  patientId: string;
  patientName: string;
  onScanUploaded?: (scan: MedicalScan) => void;
  className?: string;
}

interface MintingProgress {
  step: number;
  total: number;
  description: string;
}

const MedicalNFTMinter: React.FC<MedicalNFTMinterProps> = ({
  patientId,
  patientName,
  onScanUploaded,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingProgress, setMintingProgress] = useState<MintingProgress>({
    step: 0,
    total: 4,
    description: 'Ready to start'
  });
  const [uploadedScan, setUploadedScan] = useState<MedicalScan | null>(null);
  
  const [metadata, setMetadata] = useState<ScanMetadata>({
    diagnosisSummary: '',
    notes: '',
    medicalTags: [],
    timestamp: new Date().toISOString(),
    scanDate: new Date().toISOString().split('T')[0]
  });
  
  const [scanInfo, setScanInfo] = useState({
    scanType: '',
    organ: '',
    doctor: ''
  });

  const [tagInput, setTagInput] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/dicom'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType = validTypes.includes(file.type) || fileExtension === 'dcm';

    if (!isValidType) {
      toast({
        title: "Invalid File Type",
        description: "Please select a JPG, PNG, or DICOM file",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(''); // DICOM files don't have preview
    }

    toast({
      title: "File Selected",
      description: `${file.name} ready for upload`,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !metadata.medicalTags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        medicalTags: [...prev.medicalTags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      medicalTags: prev.medicalTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const uploadScan = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a medical scan file first",
        variant: "destructive"
      });
      return;
    }

    if (!scanInfo.scanType || !scanInfo.organ) {
      toast({
        title: "Missing Information",
        description: "Please fill in scan type and organ information",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setMintingProgress({ step: 1, total: 4, description: 'Uploading to IPFS...' });

    try {
      // Upload to IPFS
      const ipfsHash = await starknetService.uploadToIPFS(selectedFile);
      
      setMintingProgress({ step: 2, total: 4, description: 'Creating scan record...' });
      
      // Create scan record
      const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      // Fix the file type assignment logic
      let fileType: 'jpg' | 'png' | 'dicom' | 'dcm' = 'jpg';
      if (fileExtension === 'png') {
        fileType = 'png';
      } else if (fileExtension === 'dcm' || fileExtension === 'dicom') {
        fileType = 'dcm';
      } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
        fileType = 'jpg';
      }
      
      const scan: MedicalScan = {
        id: scanId,
        filename: selectedFile.name,
        type: fileType,
        scanType: scanInfo.scanType,
        organ: scanInfo.organ,
        uploadDate: new Date().toISOString(),
        doctor: scanInfo.doctor,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        thumbnailUrl: preview,
        ipfsHash
      };

      setUploadedScan(scan);
      
      toast({
        title: "Upload Complete",
        description: "Medical scan uploaded successfully to IPFS",
      });

      if (onScanUploaded) {
        onScanUploaded(scan);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload medical scan",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setMintingProgress({ step: 0, total: 4, description: 'Upload complete' });
    }
  };

  const mintNFT = async () => {
    if (!uploadedScan) {
      toast({
        title: "No Scan to Mint",
        description: "Please upload a scan first",
        variant: "destructive"
      });
      return;
    }

    setIsMinting(true);
    setMintingProgress({ step: 1, total: 4, description: 'Preparing NFT metadata...' });

    try {
      setMintingProgress({ step: 2, total: 4, description: 'Minting NFT on Starknet...' });
      
      // Mint medical NFT
      const nft = await starknetService.mintMedicalNFT(
        patientId,
        uploadedScan.scanType,
        uploadedScan.ipfsHash!,
        true // ZK protected
      );

      setMintingProgress({ step: 3, total: 4, description: 'Updating records...' });
      
      // Update scan with NFT information
      const updatedScan = {
        ...uploadedScan,
        nftTokenId: nft.tokenId,
        txHash: nft.txHash
      };
      
      setUploadedScan(updatedScan);
      
      setMintingProgress({ step: 4, total: 4, description: 'NFT minted successfully!' });
      
      toast({
        title: "NFT Minted Successfully",
        description: `Token ID: ${nft.tokenId.substring(0, 16)}...`,
      });

      // Update the parent component with the final scan data
      if (onScanUploaded) {
        onScanUploaded(updatedScan);
      }

    } catch (error) {
      console.error('Minting failed:', error);
      toast({
        title: "Minting Failed",
        description: "Failed to mint NFT on Starknet",
        variant: "destructive"
      });
    } finally {
      setIsMinting(false);
      setTimeout(() => {
        setMintingProgress({ step: 0, total: 4, description: 'Ready for next mint' });
      }, 2000);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setUploadedScan(null);
    setMetadata({
      diagnosisSummary: '',
      notes: '',
      medicalTags: [],
      timestamp: new Date().toISOString(),
      scanDate: new Date().toISOString().split('T')[0]
    });
    setScanInfo({
      scanType: '',
      organ: '',
      doctor: ''
    });
    setTagInput('');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Medical Scan Upload
          </CardTitle>
          <CardDescription>
            Upload medical scans for {patientName} and mint as NFTs on Starknet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div>
            <Label htmlFor="file-upload">Select Medical Scan *</Label>
            <div className="mt-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="font-medium">Click to upload scan</p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPG, PNG, DICOM files
                      </p>
                    </div>
                  )}
                </div>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.dcm,.dicom"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <Label>Preview</Label>
              <div className="mt-2">
                <img 
                  src={preview} 
                  alt="Scan preview" 
                  className="max-w-full h-48 object-contain border rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Scan Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="scanType">Scan Type *</Label>
              <Input
                id="scanType"
                value={scanInfo.scanType}
                onChange={(e) => setScanInfo(prev => ({ ...prev, scanType: e.target.value }))}
                placeholder="e.g., MRI, CT, X-Ray"
              />
            </div>
            
            <div>
              <Label htmlFor="organ">Organ/Body Part *</Label>
              <Input
                id="organ"
                value={scanInfo.organ}
                onChange={(e) => setScanInfo(prev => ({ ...prev, organ: e.target.value }))}
                placeholder="e.g., Brain, Heart, Lung"
              />
            </div>
            
            <div>
              <Label htmlFor="doctor">Doctor</Label>
              <Input
                id="doctor"
                value={scanInfo.doctor}
                onChange={(e) => setScanInfo(prev => ({ ...prev, doctor: e.target.value }))}
                placeholder="Attending physician"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scan Metadata
          </CardTitle>
          <CardDescription>
            Add detailed information about the medical scan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="diagnosisSummary">Diagnosis Summary</Label>
            <Textarea
              id="diagnosisSummary"
              value={metadata.diagnosisSummary}
              onChange={(e) => setMetadata(prev => ({ ...prev, diagnosisSummary: e.target.value }))}
              placeholder="Brief summary of findings..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={metadata.notes}
              onChange={(e) => setMetadata(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Detailed observations and notes..."
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="scanDate">Scan Date</Label>
            <Input
              id="scanDate"
              type="date"
              value={metadata.scanDate}
              onChange={(e) => setMetadata(prev => ({ ...prev, scanDate: e.target.value }))}
            />
          </div>
          
          {/* Medical Tags */}
          <div>
            <Label>Medical Tags</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag (e.g., fracture, tumor)"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} variant="outline" size="sm">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
            
            {metadata.medicalTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {metadata.medicalTags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            NFT Minting
          </CardTitle>
          <CardDescription>
            Upload scan to IPFS and mint as NFT on Starknet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          {(isUploading || isMinting) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{mintingProgress.description}</span>
                <span>{mintingProgress.step}/{mintingProgress.total}</span>
              </div>
              <Progress value={(mintingProgress.step / mintingProgress.total) * 100} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={uploadScan}
              disabled={!selectedFile || isUploading || !!uploadedScan}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : uploadedScan ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uploaded to IPFS
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to IPFS
                </>
              )}
            </Button>
            
            <Button
              onClick={mintNFT}
              disabled={!uploadedScan || isMinting || !!uploadedScan?.nftTokenId}
              variant="secondary"
              className="flex-1"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Minting NFT...
                </>
              ) : uploadedScan?.nftTokenId ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  NFT Minted
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Mint as NFT
                </>
              )}
            </Button>
          </div>

          {/* NFT Information */}
          {uploadedScan?.nftTokenId && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium mb-2">NFT Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Token ID:</span>
                  <span className="font-mono">{uploadedScan.nftTokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction:</span>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    <span className="font-mono">{uploadedScan.txHash?.substring(0, 16)}...</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                <div className="flex justify-between">
                  <span>IPFS Hash:</span>
                  <span className="font-mono">{uploadedScan.ipfsHash?.substring(0, 16)}...</span>
                </div>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <Button onClick={resetForm} variant="outline" className="w-full">
            Upload Another Scan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalNFTMinter;
