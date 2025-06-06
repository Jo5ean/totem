import { google } from 'googleapis';

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const credentials = {
        type: 'service_account',
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Error inicializando Google Sheets Auth:', error);
    }
  }

  async getSheetData(spreadsheetId, range) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rawData = response.data.values || [];
      
      // Si no hay datos, retornar array vacío
      if (rawData.length === 0) {
        return [];
      }
      
      // La primera fila contiene los headers
      const headers = rawData[0];
      const dataRows = rawData.slice(1);
      
      // Convertir cada fila en un objeto usando los headers
      const formattedData = dataRows.map(row => {
        const rowObject = {};
        headers.forEach((header, index) => {
          // Usar el valor de la celda o null si está vacía
          rowObject[header] = row[index] || null;
        });
        return rowObject;
      });
      
      console.log(`📋 Procesados ${formattedData.length} registros con headers:`, headers);
      
      return formattedData;
    } catch (error) {
      console.error(`Error obteniendo datos de Google Sheets: ${error.message}`);
      throw new Error(`No se pudieron obtener los datos: ${error.message}`);
    }
  }

  async getSheetMetadata(spreadsheetId) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      return response.data;
    } catch (error) {
      console.error(`Error obteniendo metadatos: ${error.message}`);
      throw new Error(`No se pudieron obtener los metadatos: ${error.message}`);
    }
  }

  async getAllSheetNames(spreadsheetId) {
    try {
      const metadata = await this.getSheetMetadata(spreadsheetId);
      return metadata.sheets.map(sheet => sheet.properties.title);
    } catch (error) {
      console.error(`Error obteniendo nombres de hojas: ${error.message}`);
      throw new Error(`No se pudieron obtener los nombres de las hojas: ${error.message}`);
    }
  }
}

export default GoogleSheetsService; 