import { Project, Finding } from '../types';

export const exportService = {
  downloadAsMarkdown(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportFindings(project: Project) {
    let md = `# Audit Findings - ${project.selectedStandard.name}\n\n`;
    md += `**Audit Scope:** ${project.projectMode.replace(/_/g, ' ')}\n`;
    md += `**Documents Reviewed:** ${project.documents.map(d => d.name).join(', ')}\n\n`;
    md += `---\n\n`;
    project.findings.forEach((f, i) => {
      md += `## Finding ${i + 1} [${f.type}]\n\n`;
      md += `**Reference:** ${f.reference}\n\n`;
      md += `${f.description}\n\n---\n\n`;
    });
    this.downloadAsMarkdown(`findings-${project.selectedStandard.name}`, md);
  },

  exportSamplingPlan(project: Project) {
    const md = `# Sampling Plan - ${project.selectedStandard.name}\n\n${project.samplingPlan}`;
    this.downloadAsMarkdown(`sampling-plan-${project.selectedStandard.name}`, md);
  },

  exportReport(project: Project, reportType: string) {
    const sections = project.report[reportType as keyof typeof project.report];
    if (!sections) return;
    let md = `# ${reportType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report - ${project.selectedStandard.name}\n\n`;
    Object.entries(sections).forEach(([sectionId, content]) => {
      md += `## ${sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n${content}\n\n---\n\n`;
    });
    this.downloadAsMarkdown(`${reportType}-report-${project.selectedStandard.name}`, md);
  },

  exportAll(project: Project) {
    let md = `# Full Audit Report - ${project.selectedStandard.name}\n\n`;
    md += `**Audit Scope:** ${project.projectMode.replace(/_/g, ' ')}\n\n`;

    if (project.findings.length > 0) {
      md += `# Findings\n\n`;
      project.findings.forEach((f, i) => {
        md += `## Finding ${i + 1} [${f.type}]\n**Reference:** ${f.reference}\n\n${f.description}\n\n---\n\n`;
      });
    }

    if (project.samplingPlan) {
      md += `# Sampling Plan\n\n${project.samplingPlan}\n\n---\n\n`;
    }

    for (const [type, sections] of Object.entries(project.report)) {
      const entries = Object.entries(sections as Record<string, string>);
      if (entries.length > 0) {
        md += `# ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Report\n\n`;
        entries.forEach(([id, content]) => {
          md += `## ${id.replace(/_/g, ' ')}\n\n${content}\n\n`;
        });
      }
    }

    this.downloadAsMarkdown(`full-audit-${project.selectedStandard.name}`, md);
  }
};
