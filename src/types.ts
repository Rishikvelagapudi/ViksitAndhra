export interface TimelineEvent {
  time: string;
  event: string;
  confidence: number;
}

export interface DynamicQA {
  question: string;
  answer: string;
}

export interface EmotionalAnalysis {
  emotion: string;
  bodyLanguage: string;
  behaviorPattern: string;
  intentInference: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

export interface ComplaintData {
  basicInfo: {
    fullName?: string;
    address?: string;
    contact?: string;
    idProof?: string;
  };
  incidentDetails: {
    dateTime?: string;
    location?: string;
    type?: string;
    description?: string;
  };
  accusedDetails: {
    name?: string;
    address?: string;
    phone?: string;
    details?: string;
  };
  witnessDetails: {
    names?: string;
    contact?: string;
    observations?: string;
  };
  propertyDetails: {
    items?: string;
    value?: string;
    serialNumbers?: string;
  };
}

export interface ComplaintResponse {
  nextQuestion: string;
  extractedData: Partial<ComplaintData>;
  isComplete: boolean;
  formalComplaint?: string;
}

export interface InvestigationReport {
  caseType: string;
  summary: string;
  timeline: TimelineEvent[];
  entities: {
    suspects: string[];
    victims: string[];
    witnesses: string[];
  };
  observations: string[];
  dynamicQA: DynamicQA[];
  factStory: string;
  conclusion: string;
  scores: {
    suspicion: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
  };
}

export interface CCTVCamera {
  id: string;
  name: string;
  status: 'Online' | 'Offline';
  fps: number;
  resolution: string;
  location: string;
  streamUrl?: string;
}

export interface DetectedObject {
  id: string;
  label: 'Person' | 'Car' | 'Bike' | 'Bus' | 'Truck' | 'Mobile Phone' | 'Bag' | 'Laptop' | 'Helmet' | 'Bicycle' | 'Animal';
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  trackingId?: string;
  timestamp: string;
  camera: string;
  details?: string;
  aiSummary?: string;
  trackingHistory?: { time: string; x: number; y: number; location: string }[];
  vehicleData?: {
    type: string;
    color: string;
    direction: string;
    speed: string;
    numberPlate: string;
  };
  personData?: {
    enteredTime: string;
    currentPosition: string;
    status: 'Moving' | 'Stationary' | 'Running';
  };
}

export interface AIAlert {
  id: string;
  time: string;
  camera: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  screenshotUrl?: string;
}

export interface LiveMonitorTimelineItem {
  id: string;
  time: string;
  event: string;
  category: 'Person' | 'Vehicle' | 'Crowd' | 'Object' | 'Alert';
  targetId?: string;
}

