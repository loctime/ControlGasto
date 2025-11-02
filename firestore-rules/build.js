const fs = require('fs');
const path = require('path');

const firestoreRulesDir = path.join(__dirname);
const outputFile = path.join(__dirname, '..', 'firestore.rules');

// Orden de los archivos a concatenar - CONTROLGASTOS (solo para testing local)
// ⚠️ IMPORTANTE: Este script solo genera reglas de CONTROLGASTOS para testing local.
// Las reglas NO deben desplegarse desde este repositorio.
// CONTROLFILE es el repositorio maestro que despliega todas las reglas al Firestore compartido.
// Para desplegar, copiar controlgastos.rules a CONTROLFILE y ejecutar build:rules allí.
const files = [
  'base.rules',
  'controlgastos.rules'
];

// Encabezado del archivo
let content = `// ⚠️ ARCHIVO GENERADO AUTOMÁTICAMENTE - NO EDITAR MANUALMENTE\n`;
content += `// Este archivo es generado por: npm run build:rules\n`;
content += `// Solo contiene reglas de CONTROLGASTOS para testing local.\n`;
content += `// Para desplegar al Firestore compartido:\n`;
content += `// 1. Copiar firestore-rules/controlgastos.rules al repositorio CONTROLFILE\n`;
content += `// 2. Actualizar firestore-rules/build.js en CONTROLFILE para incluir controlgastos.rules\n`;
content += `// 3. Ejecutar npm run build:rules y firebase deploy --only firestore:rules desde CONTROLFILE\n\n`;
content += `rules_version = '2';\n\n`;
content += `service cloud.firestore {\n`;
content += `  match /databases/{db}/documents {\n\n`;

// Leer y concatenar cada archivo
files.forEach((file) => {
  const filePath = path.join(firestoreRulesDir, file);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Agregar comentario de sección
    const sectionName = file.replace('.rules', '').toUpperCase().replace('-', '');
    content += `    /* ========= ${sectionName} ========= */\n`;
    content += `    \n`;
    
    // Agregar indentación a cada línea del contenido (4 espacios base)
    const indentedContent = fileContent
      .split('\n')
      .map(line => {
        if (line.trim() === '') return '    '; // Mantener líneas vacías con indentación
        return `    ${line}`;
      })
      .join('\n');
    
    content += indentedContent + '\n\n';
  } else {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
  }
});

// Footer con deny por defecto
content += `    /* ========= DENY POR DEFECTO ========= */\n\n`;
content += `    match /{document=**} {\n`;
content += `      allow read, write: if false;\n`;
content += `    }\n`;
content += `  }\n`;
content += `}\n`;

// Escribir el archivo concatenado
fs.writeFileSync(outputFile, content, 'utf8');

console.log('✅ Reglas de Firestore concatenadas exitosamente en firestore.rules');
console.log(`📝 Total de líneas: ${content.split('\n').length}`);

