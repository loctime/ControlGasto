#!/usr/bin/env node

/**
 * Script de validación rápida de tipos TypeScript
 * Uso: node scripts/validate-types.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Validando tipos TypeScript...\n');

try {
  // Verificar si hay errores de TypeScript
  console.log('📋 Ejecutando verificación de tipos...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Tipos validados correctamente\n');

  // Verificar archivos de tipos principales
  console.log('📋 Verificando archivos de tipos principales...');
  const typesFile = path.join(process.cwd(), 'lib/types.ts');
  
  if (fs.existsSync(typesFile)) {
    const content = fs.readFileSync(typesFile, 'utf8');
    
    // Verificar que existan las interfaces principales
    const requiredInterfaces = [
      'export interface Expense',
      'export interface Payment',
      'export interface Invoice',
      'export type ExpenseCategory',
      'export type ExpenseStatus',
      'export type PaymentType'
    ];
    
    const missingInterfaces = requiredInterfaces.filter(interfaceStr => 
      !content.includes(interfaceStr)
    );
    
    if (missingInterfaces.length > 0) {
      console.log('⚠️  Interfaces faltantes en types.ts:');
      missingInterfaces.forEach(iface => console.log(`   - ${iface}`));
      console.log('');
    } else {
      console.log('✅ Todas las interfaces principales están definidas\n');
    }
  }

  // Verificar componentes principales
  console.log('📋 Verificando componentes principales...');
  const componentsToCheck = [
    'components/expenses-dashboard.tsx',
    'components/history-content.tsx',
    'components/payment-dialog.tsx',
    'components/payment-history.tsx'
  ];
  
  componentsToCheck.forEach(component => {
    const filePath = path.join(process.cwd(), component);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Verificar que importen tipos desde @/lib/types
      if (content.includes('from "@/lib/types"')) {
        console.log(`✅ ${component} - Importa tipos correctamente`);
      } else {
        console.log(`⚠️  ${component} - No importa tipos desde @/lib/types`);
      }
    }
  });
  
  console.log('\n🎉 Validación completada exitosamente!');
  console.log('\n💡 Tip: Ejecuta este script frecuentemente durante el desarrollo');
  
} catch (error) {
  console.error('❌ Error durante la validación:');
  console.error(error.message);
  process.exit(1);
}

