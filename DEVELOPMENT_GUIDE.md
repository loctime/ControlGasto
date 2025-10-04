# 🚀 Guía de Desarrollo - ControlGasto

## 📋 Checklist Antes de Implementar Funcionalidades

### ✅ **Antes de Empezar**
- [ ] Ejecutar `npm run validate-types` para verificar estado actual
- [ ] Leer `TYPESCRIPT_BEST_PRACTICES.md`
- [ ] Planificar todas las interfaces necesarias en `lib/types.ts`

### ✅ **Durante el Desarrollo**
- [ ] Ejecutar `npm run type-check` después de cada cambio importante
- [ ] No usar `any`, siempre tipos específicos
- [ ] Importar tipos desde `@/lib/types` únicamente
- [ ] Validar props de componentes antes de usarlos

### ✅ **Antes de Commit**
- [ ] Ejecutar `npm run build` para verificar compilación
- [ ] Ejecutar `npm run validate-types` para verificar tipos
- [ ] Revisar que no haya errores de linting

## 🛠️ Comandos Útiles

```bash
# Validación rápida de tipos (NUEVO)
npm run validate-types

# Verificación completa de tipos
npm run type-check

# Build completo
npm run build

# Desarrollo con validación automática
npm run dev
```

## 🎯 Flujo de Trabajo Recomendado

1. **Planificar** → Definir interfaces en `types.ts`
2. **Implementar** → Usar `validate-types` frecuentemente
3. **Validar** → `npm run build` antes de commit
4. **Commitear** → Solo si pasa todas las validaciones

## 📚 Recursos

- `TYPESCRIPT_BEST_PRACTICES.md` - Mejores prácticas detalladas
- `scripts/validate-types.js` - Script de validación automática
- `.vscode/settings.json` - Configuración del editor

## 🚨 Errores Comunes a Evitar

1. **No definir tipos completos desde el inicio**
2. **Usar `any` en lugar de tipos específicos**
3. **No validar durante el desarrollo**
4. **Crear interfaces duplicadas**
5. **No manejar props opcionales correctamente**

## 💡 Tips

- Usar el script `validate-types` como "guardián" durante el desarrollo
- Configurar el editor con las mejores prácticas de TypeScript
- Mantener una sola fuente de verdad para tipos en `lib/types.ts`
- Documentar tipos complejos con comentarios

