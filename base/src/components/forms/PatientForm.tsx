
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Shield, User, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/utils/localStorage';
import { zkIdentityService } from '@/services/zkIdentityService';
import { toast } from '@/hooks/use-toast';

interface PatientFormProps {
  patient?: Patient;
  onSubmit: (patient: Patient) => void;
  onCancel: () => void;
}

const PatientForm = ({ patient, onSubmit, onCancel }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    name: patient?.name || '',
    age: patient?.age || 0,
    gender: patient?.gender || '',
    dateOfBirth: patient?.dateOfBirth || '',
    condition: patient?.condition || '',
    diagnosis: patient?.diagnosis || '',
    doctor: patient?.doctor || '',
    starknetWalletAddress: patient?.starknetWalletAddress || '',
    consentEnabled: patient?.consentEnabled || false,
    zkProtected: !!patient?.zkIdentityHash
  });
  
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zkGenerating, setZkGenerating] = useState(false);

  const generateZKIdentity = async () => {
    if (!formData.name || !formData.starknetWalletAddress) {
      toast({
        title: "Missing Information",
        description: "Name and Starknet wallet address are required for ZK identity",
        variant: "destructive"
      });
      return;
    }

    setZkGenerating(true);
    try {
      const { zkIdentityHash } = await zkIdentityService.generatePatientZKIdentity({
        fullName: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        walletAddress: formData.starknetWalletAddress
      });

      setFormData(prev => ({ ...prev, zkIdentityHash }));
      
      toast({
        title: "ZK Identity Generated",
        description: "Patient identity secured with zero-knowledge proof"
      });
    } catch (error) {
      toast({
        title: "ZK Generation Failed",
        description: "Could not generate zero-knowledge identity",
        variant: "destructive"
      });
    } finally {
      setZkGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.condition) {
      toast({
        title: "Required Fields Missing",
        description: "Name and condition are required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const patientData: Patient = {
        id: patient?.id || `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
        dateOfBirth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : formData.dateOfBirth,
        condition: formData.condition,
        diagnosis: formData.diagnosis,
        doctor: formData.doctor,
        admissionDate: patient?.admissionDate || new Date().toISOString(),
        starknetWalletAddress: formData.starknetWalletAddress,
        zkIdentityHash: formData.zkProtected ? (formData as any).zkIdentityHash : undefined,
        consentEnabled: formData.consentEnabled,
        blockchainStatus: 'pending' as const,
        medicalRecords: patient?.medicalRecords || [],
        scansAndImages: patient?.scansAndImages || [],
        activityFeed: patient?.activityFeed || []
      };

      onSubmit(patientData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save patient record",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
          <CardDescription>
            Basic demographic and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Patient full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                placeholder="Age in years"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
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

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Medical Information
          </CardTitle>
          <CardDescription>
            Current condition and medical details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition">Primary Condition *</Label>
            <Input
              id="condition"
              value={formData.condition}
              onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
              placeholder="e.g., Hypertension, Diabetes, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Detailed diagnosis information"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor">Attending Physician</Label>
            <Input
              id="doctor"
              value={formData.doctor}
              onChange={(e) => setFormData(prev => ({ ...prev, doctor: e.target.value }))}
              placeholder="Dr. Name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Blockchain
          </CardTitle>
          <CardDescription>
            Configure privacy settings and blockchain integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet">Starknet Wallet Address</Label>
            <Input
              id="wallet"
              value={formData.starknetWalletAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, starknetWalletAddress: e.target.value }))}
              placeholder="0x..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Data Consent</Label>
              <p className="text-sm text-muted-foreground">
                Allow medical data to be used for research
              </p>
            </div>
            <Switch
              checked={formData.consentEnabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consentEnabled: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>ZK Identity Protection</Label>
              <p className="text-sm text-muted-foreground">
                Protect identity with zero-knowledge proofs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.zkProtected}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, zkProtected: checked }))}
              />
              {formData.zkProtected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateZKIdentity}
                  disabled={zkGenerating}
                >
                  {zkGenerating ? 'Generating...' : 'Generate ZK'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : patient ? 'Update Patient' : 'Create Patient'}
        </Button>
      </div>
    </div>
  );
};

export default PatientForm;
