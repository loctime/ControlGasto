#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 Configurando Firebase para GastosApp...\n');

// Verificar si existe .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env.local creado desde env.example');
  } else {
    console.log('❌ No se encontró env.example');
    process.exit(1);
  }
} else {
  console.log('✅ Archivo .env.local ya existe');
}

console.log('\n📋 Pasos para configurar Firebase:');
console.log('1. Ve a https://console.firebase.google.com/');
console.log('2. Crea un nuevo proyecto o selecciona uno existente');
console.log('3. Habilita Authentication:');
console.log('   - Ve a Authentication > Sign-in method');
console.log('   - Habilita "Email/Password" y "Google"');
console.log('4. Crea Firestore Database:');
console.log('   - Ve a Firestore Database > Create database');
console.log('   - Elige "Start in test mode"');
console.log('5. Obtén las credenciales:');
console.log('   - Ve a Project Settings > General > Your apps');
console.log('   - Agrega una app web y copia la configuración');
console.log('6. Actualiza el archivo .env.local con tus credenciales');

console.log('\n🚀 Una vez configurado, ejecuta:');
console.log('npm run dev');

console.log('\n📚 Documentación:');
console.log('- Firebase Console: https://console.firebase.google.com/');
console.log('- Next.js + Firebase: https://firebase.google.com/docs/web/setup');
