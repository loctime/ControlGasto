#!/usr/bin/env node

/**
 * Script para probar el endpoint /api/shares/create
 * Ejecutar después de aplicar el fix en el servidor
 */

const fetch = require('node-fetch');

// Configuración
const BACKEND_URL = 'https://controlfile.onrender.com';
const TEST_FILE_ID = 'UwMiL1F7xk52fyZRrCD1'; // FileId de prueba

async function testSharesEndpoint() {
  console.log('🧪 Probando endpoint /api/shares/create...');
  
  try {
    // Nota: En un entorno real, necesitarías un token válido
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await fetch(`${BACKEND_URL}/api/shares/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: TEST_FILE_ID,
        expiresIn: 87600 // 10 años
      })
    });

    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Éxito:', result);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
      return false;
    }
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando prueba del endpoint de shares...');
  
  const success = await testSharesEndpoint();
  
  if (success) {
    console.log('🎉 ¡El fix funcionó! El endpoint /api/shares/create está operativo.');
  } else {
    console.log('⚠️ El endpoint aún tiene problemas. Revisar el fix en el servidor.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSharesEndpoint };
