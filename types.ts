export interface StandardDocument {
  id: string;
  name: string;
  content: string;
  applicability: 'always' | 'sometimes';
}

export interface Standard {
  id: string;
  name: string;
  description: string;
  documents: StandardDocument[];
}

export interface ReportTemplateSection {
  id: string;
  name: string;
  content: string; // The prompt/template for this section
}

export interface ReportTemplate {
  id: 'validation_report' | 'verification_report' | 'ghg_inventory_report' | 'corsia_report';
  name: string;
  sections: ReportTemplateSection[];
}

export interface ProjectDocument {
  id: number;
  name: string;
  content: string;
}

export enum FindingType {
  CL = 'CL', // Clarification Request
  CAR = 'CAR', // Corrective Action Request
  FAR = 'FAR', // Forward Action Request
}

export interface Finding {
  type: FindingType;
  description: string;
  reference: string;
}

export type LibraryDocumentType = 'finding' | 'report' | 'response_finding' | 'response_registry' | 'response_technical' | 'knowledge_base';

export interface LibraryDocument {
  id: string;
  name: string;
  content: string;
  type: LibraryDocumentType;
}

export interface SamplingParameters {
  approach: 'estimation' | 'acceptance';
  method: 'simple_random' | 'stratified' | 'systematic' | 'cluster_single' | 'cluster_multi';
  populationSize: string;
  aql?: string; // Acceptable Quality Level
  uql?: string; // Unacceptable Quality Level
  producerRisk?: string;
  consumerRisk?: string;
  confidence?: string;
  precision?: string;
  seed?: string; // Random seed for reproducibility
  additionalContext: string;
}

export interface Project {
  id: string;
  selectedStandard: Standard;
  selectedOptionalDocuments: StandardDocument[];
  selectedGoverningDocuments: StandardDocument[];
  documents: ProjectDocument[];
  findings: Finding[];
  samplingPlan: string;
  report: {
    validation: Record<string, string>; // sectionId -> generated content
    verification: Record<string, string>; // sectionId -> generated content
    ghg_inventory: Record<string, string>; // sectionId -> generated content
    corsia: Record<string, string>; // sectionId -> generated content
  };
  responses: Record<string, string>; // Maps received comment to drafted response
  projectMode: string;
}

export type ActiveAction = string | null;