import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Activity, Heart, Thermometer, Droplet, Zap, Maximize2, ChevronDown, Wifi, ChevronsUp, Clock, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import PatientMonitorConnector from './PatientMonitorConnector';
import { toast } from '@/hooks/use-toast';
import { loadPatientData, loadSettings, saveAIAnalysis } from '@/utils/localStorage';
import { groqService } from '@/services/groqService';

interface VitalSign {
  name: string;
  value: number;
  unit: string;
  normalRange: [number, number];
  critical: boolean;
  increasing: boolean;
}

interface TelemetryData {
  heartRate: number;
  bloodPressure: number;
  temperature: number;
  oxygenSaturation: number;
  timestamp: Date;
}

interface PatientMonitorProps {
  className?: string;
}

const PatientMonitor = ({ className }: PatientMonitorProps) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [telemetryData, setTelemetryData] = useState<Record<string, TelemetryData[]>>({});
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [showConnector, setShowConnector] = useState(false);
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  
  useEffect(() => {
    const patientData = loadPatientData();
    setPatients(patientData);
    
    if (patientData.length > 0) {
      setSelectedPatientId(patientData[0].id);
    }
  }, []);
  
  useEffect(() => {
    if (!selectedPatientId) return;
    
    const patientTelemetry = telemetryData[selectedPatientId] || [];
    const latestTelemetry = patientTelemetry[patientTelemetry.length - 1];
    
    if (!latestTelemetry) {
      if (isSimulationActive) {
        simulateTelemetryData();
      }
      return;
    }
    
    const newVitalSigns: VitalSign[] = [
      {
        name: 'Heart Rate',
        value: latestTelemetry.heartRate,
        unit: 'bpm',
        normalRange: [60, 100],
        critical: latestTelemetry.heartRate < 50 || latestTelemetry.heartRate > 130,
        increasing: patientTelemetry.length > 1 ? 
          latestTelemetry.heartRate > patientTelemetry[patientTelemetry.length - 2].heartRate : false
      },
      {
        name: 'Blood Pressure',
        value: latestTelemetry.bloodPressure,
        unit: 'mmHg',
        normalRange: [90, 140],
        critical: latestTelemetry.bloodPressure < 80 || latestTelemetry.bloodPressure > 160,
        increasing: patientTelemetry.length > 1 ? 
          latestTelemetry.bloodPressure > patientTelemetry[patientTelemetry.length - 2].bloodPressure : false
      },
      {
        name: 'Temperature',
        value: latestTelemetry.temperature,
        unit: '°C',
        normalRange: [36.1, 37.2],
        critical: latestTelemetry.temperature < 35 || latestTelemetry.temperature > 39,
        increasing: patientTelemetry.length > 1 ? 
          latestTelemetry.temperature > patientTelemetry[patientTelemetry.length - 2].temperature : false
      },
      {
        name: 'Oxygen Saturation',
        value: latestTelemetry.oxygenSaturation,
        unit: '%',
        normalRange: [95, 100],
        critical: latestTelemetry.oxygenSaturation < 90,
        increasing: patientTelemetry.length > 1 ? 
          latestTelemetry.oxygenSaturation > patientTelemetry[patientTelemetry.length - 2].oxygenSaturation : false
      }
    ];
    
    setVitalSigns(newVitalSigns);
    
    const hasCriticalVitals = newVitalSigns.some(vital => vital.critical);
    if (hasCriticalVitals) {
      analyzeVitalsWithAI(newVitalSigns, selectedPatientId);
    }
  }, [selectedPatientId, telemetryData, isSimulationActive]);
  
  const analyzeVitalsWithAI = async (vitals: VitalSign[], patientId: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;
      
      const vitalsText = vitals.map(v => 
        `${v.name}: ${v.value}${v.unit} (${v.critical ? 'CRITICAL' : 'normal'})`
      ).join('\n');
      
      const prompt = `Patient data: 
        Name: ${patient.name}
        Age: ${patient.age}
        Gender: ${patient.gender}
        Condition: ${patient.condition}
        
        Current vital signs:
        ${vitalsText}
        
        Based on the above vital signs, provide a brief medical assessment of the patient's current state. 
        Indicate if any immediate medical intervention is needed. Be concise but precise.`;
      
      const response = await groqService.chat([
        { role: 'system', content: 'You are a medical AI assistant. Your analysis should be brief, accurate and actionable.' },
        { role: 'user', content: prompt }
      ]);
      
      let severity = 'normal';
      if (vitals.some(v => v.critical)) {
        severity = 'critical';
      } else if (vitals.some(v => v.value < v.normalRange[0] || v.value > v.normalRange[1])) {
        severity = 'warning';
      }
      
      saveAIAnalysis(patientId, {
        text: response,
        severity,
        timestamp: new Date()
      });
      
      if (severity === 'critical') {
        toast({
          variant: "destructive",
          title: "Critical Vital Signs",
          description: "AI has detected critical vital signs. Check the analysis tab.",
        });
      }
    } catch (error) {
      console.error("Error analyzing vitals with AI:", error);
    }
  };
  
  const simulateTelemetryData = useCallback(() => {
    if (!selectedPatientId || !isSimulationActive) return;
    
    const currentTelemetry = {...telemetryData};
    const patientTelemetry = currentTelemetry[selectedPatientId] || [];
    
    const patient = patients.find(p => p.id === selectedPatientId);
    
    let heartRateBase = 75;
    let bloodPressureBase = 120;
    let temperatureBase = 36.7;
    let oxygenBase = 98;
    
    if (patient) {
      if (patient.condition.toLowerCase().includes('cardiac')) {
        heartRateBase = 90;
        bloodPressureBase = 140;
      } else if (patient.condition.toLowerCase().includes('fever') || 
                patient.condition.toLowerCase().includes('malaria')) {
        temperatureBase = 38.5;
        heartRateBase = 85;
      } else if (patient.condition.toLowerCase().includes('asthma') || 
                patient.condition.toLowerCase().includes('respiratory')) {
        oxygenBase = 94;
      }
    }
    
    const newReading: TelemetryData = {
      heartRate: Math.round(heartRateBase + (Math.random() * 20 - 10)),
      bloodPressure: Math.round(bloodPressureBase + (Math.random() * 20 - 10)),
      temperature: Number((temperatureBase + (Math.random() * 1 - 0.5)).toFixed(1)),
      oxygenSaturation: Math.round(oxygenBase + (Math.random() * 4 - 2)),
      timestamp: new Date()
    };
    
    if (Math.random() < 0.1) {
      const criticalIndex = Math.floor(Math.random() * 4);
      switch (criticalIndex) {
        case 0: // Heart rate
          newReading.heartRate = Math.random() < 0.5 ? 45 : 140;
          break;
        case 1: // Blood pressure
          newReading.bloodPressure = Math.random() < 0.5 ? 75 : 170;
          break;
        case 2: // Temperature
          newReading.temperature = Math.random() < 0.5 ? 34.5 : 39.5;
          break;
        case 3: // Oxygen
          newReading.oxygenSaturation = 88;
          break;
      }
    }
    
    const updatedTelemetry = [...patientTelemetry, newReading].slice(-30);
    currentTelemetry[selectedPatientId] = updatedTelemetry;
    
    setTelemetryData(currentTelemetry);
    
    if (isSimulationActive) {
      setTimeout(simulateTelemetryData, 3000);
    }
  }, [selectedPatientId, telemetryData, patients, isSimulationActive]);
  
  useEffect(() => {
    if (selectedPatientId && isSimulationActive) {
      simulateTelemetryData();
    }
  }, [selectedPatientId, simulateTelemetryData, isSimulationActive]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const handleTelemetryData = (patientId: string, data: TelemetryData) => {
    const currentTelemetry = {...telemetryData};
    const patientTelemetry = currentTelemetry[patientId] || [];
    
    const updatedTelemetry = [...patientTelemetry, data].slice(-30);
    currentTelemetry[patientId] = updatedTelemetry;
    
    setTelemetryData(currentTelemetry);
  };
  
  const toggleSimulation = () => {
    const newSimulationState = !isSimulationActive;
    setIsSimulationActive(newSimulationState);
    
    if (newSimulationState) {
      simulateTelemetryData();
      toast({
        title: "Simulation Enabled",
        description: "Now showing simulated telemetry data",
      });
    } else {
      toast({
        title: "Simulation Disabled",
        description: "Connect a device to receive real telemetry data",
      });
    }
  };
  
  const formatChartData = (patientId: string) => {
    const data = telemetryData[patientId] || [];
    return data.map((item, index) => ({
      name: index,
      heartRate: item.heartRate,
      bloodPressure: item.bloodPressure / 2,
      temperature: item.temperature * 2,
      oxygenSaturation: item.oxygenSaturation,
      time: item.timestamp.toLocaleTimeString(),
    }));
  };
  
  const getStatusColor = (value: number, range: [number, number]) => {
    if (value < range[0] * 0.8 || value > range[1] * 1.2) {
      return 'text-health-critical';
    } else if (value < range[0] || value > range[1]) {
      return 'text-health-warning';
    } else {
      return 'text-health-normal';
    }
  };
  
  const getSelectedPatient = () => {
    return patients.find(patient => patient.id === selectedPatientId);
  };
  
  return (
    <div className={cn(
      "grid gap-6 transition-all duration-200",
      isFullscreen ? "fixed inset-0 z-50 bg-background p-6" : "",
      className
    )}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-health-normal animate-pulse"></div>
            <h2 className="text-xl font-semibold">Patient Monitoring</h2>
          </div>
          <p className="text-muted-foreground">Real-time vital signs monitoring</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSimulation}
            className={cn(isSimulationActive && "text-orange-500 border-orange-200")}
          >
            {isSimulationActive ? (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Simulation Active
              </>
            ) : (
              <>
                <Wifi className="mr-2 h-4 w-4" />
                Live Data Mode
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Patients</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConnector(!showConnector)}
              >
                <Wifi className="mr-2 h-4 w-4" />
                Connect
              </Button>
            </CardTitle>
            <CardDescription>Select a patient to monitor</CardDescription>
          </CardHeader>
          
          {showConnector ? (
            <CardContent>
              <PatientMonitorConnector 
                patients={patients}
                onTelemetryData={handleTelemetryData}
              />
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-24rem)]">
                {patients.map((patient) => (
                  <div key={patient.id}>
                    <button
                      className={cn(
                        "flex items-center justify-between w-full p-4 text-left hover:bg-muted transition-colors",
                        selectedPatientId === patient.id && "bg-muted"
                      )}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{patient.name}</span>
                        <span className="text-sm text-muted-foreground">ID: {patient.id}</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{patient.gender}, {patient.age}</span>
                        </div>
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{patient.condition}</span>
                      </div>
                    </button>
                    <Separator />
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          )}
        </Card>
        
        <div className="md:col-span-5">
          {selectedPatientId ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Detailed Charts</TabsTrigger>
                <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {vitalSigns.map((vital) => (
                    <Card key={vital.name}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          {vital.name === 'Heart Rate' && <Heart className="h-4 w-4 text-health-critical" />}
                          {vital.name === 'Blood Pressure' && <Activity className="h-4 w-4 text-health-warning" />}
                          {vital.name === 'Temperature' && <Thermometer className="h-4 w-4 text-health-normal" />}
                          {vital.name === 'Oxygen Saturation' && <Droplet className="h-4 w-4 text-health-normal" />}
                          {vital.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-end justify-between">
                          <div className="flex items-end gap-1">
                            <span className={cn(
                              "text-3xl font-bold tabular-nums",
                              getStatusColor(vital.value, vital.normalRange)
                            )}>
                              {vital.value}
                            </span>
                            <span className="text-sm text-muted-foreground mb-1">{vital.unit}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 h-6">
                            {vital.increasing ? <ChevronsUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            {vital.critical && <AlertTriangle className="h-5 w-5 text-health-critical" />}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          Normal range: {vital.normalRange[0]}-{vital.normalRange[1]} {vital.unit}
                        </div>
                        
                        <div className="h-16 mt-2">
                          {telemetryData[selectedPatientId] && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={formatChartData(selectedPatientId)}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                              >
                                <Line
                                  type="monotone"
                                  dataKey={vital.name === 'Heart Rate' ? 'heartRate' : 
                                          vital.name === 'Blood Pressure' ? 'bloodPressure' :
                                          vital.name === 'Temperature' ? 'temperature' : 'oxygenSaturation'}
                                  stroke={vital.critical ? "#ef4444" : "#8884d8"}
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{ r: 4 }}
                                  isAnimationActive={false}
                                />
                                <ReferenceLine
                                  y={vital.name === 'Blood Pressure' ? vital.normalRange[0] / 2 : 
                                     vital.name === 'Temperature' ? vital.normalRange[0] * 2 : 
                                     vital.normalRange[0]}
                                  stroke="#10b981"
                                  strokeDasharray="3 3"
                                />
                                <ReferenceLine
                                  y={vital.name === 'Blood Pressure' ? vital.normalRange[1] / 2 : 
                                     vital.name === 'Temperature' ? vital.normalRange[1] * 2 : 
                                     vital.normalRange[1]}
                                  stroke="#10b981"
                                  strokeDasharray="3 3"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {getSelectedPatient() && (
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">Patient Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-medium">{getSelectedPatient()?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ID</p>
                          <p className="font-medium">{getSelectedPatient()?.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Age / Gender</p>
                          <p className="font-medium">{getSelectedPatient()?.age} / {getSelectedPatient()?.gender}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Condition</p>
                          <p className="font-medium">{getSelectedPatient()?.condition}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="charts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Heart Rate & Blood Pressure</CardTitle>
                    <CardDescription>Trend over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {telemetryData[selectedPatientId] && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={formatChartData(selectedPatientId)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'bloodPressure') {
                                  return [Number(value) * 2 + ' mmHg', 'Blood Pressure'];
                                }
                                return [value + (name === 'heartRate' ? ' bpm' : ''), name];
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="heartRate" 
                              name="Heart Rate"
                              stroke="#ef4444" 
                              activeDot={{ r: 8 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="bloodPressure" 
                              name="Blood Pressure"
                              stroke="#3b82f6" 
                            />
                            <ReferenceLine y={60} stroke="#10b981" strokeDasharray="3 3" />
                            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Temperature & Oxygen</CardTitle>
                    <CardDescription>Trend over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {telemetryData[selectedPatientId] && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={formatChartData(selectedPatientId)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'temperature') {
                                  return [Number(value) / 2 + ' °C', 'Temperature'];
                                }
                                return [value + (name === 'oxygenSaturation' ? '%' : ''), name];
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="temperature" 
                              name="Temperature"
                              stroke="#f97316" 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="oxygenSaturation" 
                              name="Oxygen"
                              stroke="#06b6d4" 
                              activeDot={{ r: 8 }} 
                            />
                            <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Medical Analysis</CardTitle>
                    <CardDescription>Automated analysis of vital signs and patient data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedPatientId && telemetryData[selectedPatientId]?.length > 0 ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Current Assessment</h3>
                          <div className="p-4 border rounded-lg">
                            <p className="text-muted-foreground">
                              <Clock className="inline-block mr-2 h-4 w-4" /> 
                              Analysis based on data from {new Date().toLocaleTimeString()}
                            </p>
                            
                            <div className="mt-4 flex flex-col gap-4">
                              {vitalSigns.some(v => v.critical) ? (
                                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-red-600">Critical Values Detected</h4>
                                    <p className="text-sm mt-1">
                                      {vitalSigns.filter(v => v.critical).map(v => 
                                        `${v.name}: ${v.value}${v.unit}`
                                      ).join(', ')}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                                  <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-green-600">Vitals within normal ranges</h4>
                                    <p className="text-sm mt-1">
                                      Patient's vital signs are currently stable.
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <h4 className="font-medium mb-2">AI Telemetry Analysis</h4>
                                <p className="text-sm">
                                  {vitalSigns.some(v => v.critical) ? (
                                    "Based on the current vital sign readings, immediate medical attention may be required. The vital signs indicate potential physiological instability that should be assessed by healthcare staff immediately."
                                  ) : vitalSigns.some(v => v.value < v.normalRange[0] || v.value > v.normalRange[1]) ? (
                                    "Some vital signs are outside normal ranges but not at critical levels. Consider increasing monitoring frequency and check for other symptoms."
                                  ) : (
                                    "All vital signs are within normal parameters. Continue routine monitoring according to care plan."
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Zap className="h-10 w-10 mb-2 opacity-20" />
                        <p>No telemetry data available for analysis</p>
                        <p className="text-sm">Connect a device or enable simulation to generate data</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-[calc(100vh-20rem)]">
              <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p>Select a patient to view monitoring data</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientMonitor;
