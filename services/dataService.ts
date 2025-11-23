import { dbService } from './db';
import { Standard, ReportTemplate, LibraryDocument } from '../types';

export const dataService = {
    async getStandards(): Promise<Standard[]> {
        return dbService.getStandards();
    },

    async getReportTemplates(): Promise<ReportTemplate[]> {
        return dbService.getReportTemplates();
    },

    async getLibraryDocuments(): Promise<LibraryDocument[]> {
        return dbService.getLibraryDocs();
    },

    async getMainGoverningRequirements(): Promise<Standard> {
        return dbService.getMainGoverning();
    }
};