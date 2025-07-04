import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido`,
      allowedMethods: ['GET']
    });
  }

  try {
    console.log('🔍 Debug específico de rangos...');
    
    const credentials = {
      type: 'service_account',
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    const TOTEM_SHEET_ID = '12_tx2DXfebO-5SjRTiRTg3xebVR1x-5xJ_BFY7EPaS8';
    
    // Probar rangos específicos basados en la estructura que vimos
    const testsToRun = [
      "Especial Junio!A1:Q10",  // Headers + primeras filas
      "Especial Junio!A1:A10",  // Solo primera columna
      "Especial Junio!1:10",    // Primeras 10 filas completas
      "'Especial Junio'!A1:Q10" // Con comillas por si tiene espacios
    ];
    
    const results = [];
    
    for (const range of testsToRun) {
      try {
        console.log(`🧪 Probando rango: ${range}`);
        
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: TOTEM_SHEET_ID,
          range: range,
        });
        
        const rawValues = response.data.values || [];
        
        results.push({
          range: range,
          success: true,
          totalRows: rawValues.length,
          hasData: rawValues.length > 0 && rawValues[0] && rawValues[0].length > 0,
          firstRow: rawValues[0] || [],
          firstRowLength: (rawValues[0] || []).length,
          sampleData: rawValues.slice(0, 3),
          cellA1: rawValues[0] ? rawValues[0][0] : null,
          cellB1: rawValues[0] ? rawValues[0][1] : null
        });
        
        // Si encontramos datos, mostrar más detalle
        if (rawValues.length > 0 && rawValues[0] && rawValues[0].length > 0) {
          console.log(`✅ ¡DATOS ENCONTRADOS en ${range}!`);
          console.log('Primera fila:', rawValues[0]);
        }
        
      } catch (error) {
        results.push({
          range: range,
          success: false,
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      debug: {
        testResults: results,
        foundData: results.some(r => r.success && r.hasData)
      },
      message: 'Debug de rangos específicos completado'
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en debug',
      message: error.message
    });
  }
} 