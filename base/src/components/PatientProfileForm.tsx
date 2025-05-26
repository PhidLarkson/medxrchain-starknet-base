
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Shield, Wallet, Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { zkIdentityService } from '@/services/zkIdentityService';
import { useStarknet } from '@/hooks/useStarknet';
import { Patient } from '@/utils/localStorage';

interface PatientProfileFormProps {
  onSubmit: (patient: Omit<Patient, 'blockchainStatus'>) => void;
  initialData?: Partial<Patient>;
  isEditing?: boolean;
}

const PatientProfileForm: React.FC<PatientProfileFormProps> = ({
  onSubmit,
  initialData,
  isEditing = false
}) => {
  const { isConnected, address } = useStarknet();
  const [isGeneratingZK, setIsGeneratingZK] = useState(false);
  const [zkGenerated, setZkGenerated] = useState(false);
  
  const [formData, setFormData] = useState({
    id: initialData?.id || '',
    name: initialData?.name || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    age: initialData?.age?.toString() || '',
    gender: initialData?.gender || 'male',
    condition: initialData?.condition || '',
    diagnosis: initialData?.diagnosis || '',
    admissionDate: initialData?.admissionDate || new Date().toISOString().split('T')[0],
    doctor: initialData?.doctor || '',
    zkIdentityHash: initialData?.zkIdentityHash || '',
    starknetWalletAddress: initialData?.starknetWalletAddress || address || '',
    consentEnabled: initialData?.consentEnabled || true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateZKIdentity = async () => {
    if (!formData.name || !formData.dateOfBirth || !formData.gender) {
      toast({
        title: "Missing Information",
        description: "Please fill in name, date of birth, and gender before generating ZK identity",
        variant: "destructive"
      });
      return;
    }

    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Starknet wallet first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingZK(true);
    try {
      const { zkProof, zkIdentityHash } = await zkIdentityService.generatePatientZKIdentity({
        fullName: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        walletAddress: address
      });

      setFormData(prev => ({
        ...prev,
        zkIdentityHash,
        starknetWalletAddress: address
      }));

      setZkGenerated(true);
      
      toast({
        title: "ZK Identity Generated",
        description: `Identity hash: ${zkIdentityHash.substring(0, 16)}...`,
      });

    } catch (error) {
      console.error('ZK generation failed:', error);
      toast({
        title: "ZK Generation Failed",
        description: "Failed to generate zero-knowledge identity",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingZK(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.age || !formData.condition) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!isEditing && !formData.zkIdentityHash) {
      toast({
        title: "ZK Identity Required",
        description: "Please generate ZK identity before creating patient profile",
        variant: "destructive"
      });
      return;
    }

    const patientData: Omit<Patient, 'blockchainStatus'> = {
      id: formData.id || `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      condition: formData.condition,
      diagnosis: formData.diagnosis,
      admissionDate: formData.admissionDate,
      doctor: formData.doctor,
      dateOfBirth: formData.dateOfBirth,
      zkIdentityHash: formData.zkIdentityHash,
      starknetWalletAddress: formData.starknetWalletAddress,
      consentEnabled: formData.consentEnabled,
      medicalRecords: initialData?.medicalRecords || [],
      scansAndImages: initialData?.scansAndImages || [],
      activityFeed: initialData?.activityFeed || []
    };

    onSubmit(patientData);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {isEditing ? 'Edit Patient Profile' : 'Create Patient Profile'}
        </CardTitle>
        <CardDescription>
          Secure patient registration with zero-knowledge identity verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Patient full name"
              />
            </div>
            
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Age"
              />
            </div>
            
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Medical Information</h3>
          
          <div>
            <Label htmlFor="condition">Primary Condition *</Label>
            <Input
              id="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange('condition', e.target.value)}
              placeholder="Primary medical condition"
            />
          </div>
          
          <div>
            <Label htmlFor="diagnosis">Detailed Diagnosis</Label>
            <Input
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              placeholder="Detailed diagnosis and notes"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="admissionDate">Admission Date</Label>
              <Input
                id="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={(e) => handleInputChange('admissionDate', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="doctor">Attending Physician</Label>
              <Input
                id="doctor"
                value={formData.doctor}
                onChange={(e) => handleInputChange('doctor', e.target.value)}
                placeholder="Doctor name"
              />
            </div>
          </div>
        </div>

        {/* ZK Identity Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zero-Knowledge Identity
            </h3>
            
            {formData.zkIdentityHash && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                ZK Generated
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="walletAddress">Starknet Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  id="walletAddress"
                  value={formData.starknetWalletAddress}
                  onChange={(e) => handleInputChange('starknetWalletAddress', e.target.value)}
                  placeholder="0x..."
                  readOnly={isConnected}
                />
                {!isConnected && (
                  <Button variant="outline" size="sm">
                    <Wallet className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {formData.zkIdentityHash && (
              <div>
                <Label>ZK Identity Hash</Label>
                <div className="p-2 bg-background border rounded text-sm font-mono">
                  {formData.zkIdentityHash}
                </div>
              </div>
            )}
            
            <Button
              onClick={generateZKIdentity}
              disabled={isGeneratingZK || !isConnected}
              className="w-full"
              variant={zkGenerated ? "secondary" : "default"}
            >
              {isGeneratingZK ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating ZK Identity...
                </>
              ) : zkGenerated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ZK Identity Generated
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Generate ZK Identity
                </>
              )}
            </Button>
            
            {!isConnected && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Connect your Starknet wallet to generate ZK identity
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="w-full" size="lg">
          {isEditing ? 'Update Patient Profile' : 'Create Patient Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PatientProfileForm;
