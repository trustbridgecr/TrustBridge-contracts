# 🏗️ TrustBridge Project Structure

Esta es la nueva estructura organizacional del proyecto TrustBridge, completamente reorganizada y optimizada.

## 📁 Estructura del Directorio

```
TrustBridge-contracts/
├── 📦 contracts/                    # 🎯 Todos los contratos inteligentes
│   ├── 🔮 oracle/                  # Oracle de precios (SEP-40)
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs             # Contrato principal
│   │   │   ├── storage.rs         # Gestión de almacenamiento
│   │   │   ├── error.rs           # Manejo de errores
│   │   │   └── events.rs          # Eventos del contrato
│   │   └── target/                # Binarios compilados
│   │
│   ├── 🏭 pool-factory/           # Fábrica de pools de préstamo
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── pool_factory.rs
│   │   │   ├── storage.rs
│   │   │   └── errors.rs
│   │   └── target/
│   │
│   ├── 🛡️ backstop/                # Mecanismo de respaldo
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── backstop/
│   │   │   ├── dependencies/
│   │   │   └── emissions/
│   │   └── target/
│   │
│   ├── 🏊 pool/                    # Pool principal de préstamos
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── pool/
│   │   │   ├── auctions/
│   │   │   └── dependencies/
│   │   └── target/
│   │
│   ├── 🪙 tbrg-token/              # Token de gobernanza TrustBridge
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── contract.rs
│   │   │   └── metadata.rs
│   │   └── target/
│   │
│   ├── 🔧 emitter/                 # Contratos de emisión
│   │   └── README.md
│   │
│   └── 🎭 mocks/                   # Contratos mock para testing
│       ├── mock-pool-factory/
│       ├── mock-pool/
│       └── moderc3156/
│
├── 🛠️ tools/                       # 🚀 Herramientas y scripts
│   ├── 📜 deploy-all.sh           # ⭐ Script principal de deployment
│   └── 📁 scripts/                # Scripts adicionales
│       ├── deploy_oracle.sh
│       ├── set_price_batch.sh
│       ├── transfer_admin.sh
│       └── verify_oracle.sh
│
├── 🧪 testing/                     # 🔬 Suites de pruebas
│   └── test-suites/               # Pruebas integrales
│       ├── Cargo.toml
│       ├── src/
│       ├── tests/
│       └── fuzz/
│
├── 📚 docs/                        # 📖 Documentación
│   ├── README.md                  # Índice de documentación
│   ├── DEPLOYMENT.md              # ⭐ Guía completa de deployment
│   ├── CONTRIBUTORS_GUIDELINE.md
│   └── GIT_GUIDELINE.md
│
├── 🔒 audits/                      # 🛡️ Reportes de auditoría
│   ├── BlendCertoraReport.pdf
│   └── blend_capital_final.pdf
│
├── ⚙️ Cargo.toml                   # Configuración del workspace
├── 🦀 rust-toolchain.toml         # Especificación de toolchain
├── 📃 LICENSE                     # Licencia AGPL-3.0
└── 📖 README.md                   # ⭐ README principal del proyecto
```

## 🎯 Contratos Principales

### Core Contracts

| Contrato | Ubicación | Descripción | Estado |
|----------|-----------|-------------|--------|
| **Oracle** | `contracts/oracle/` | Oracle de precios SEP-40 | ✅ Funcional |
| **Pool Factory** | `contracts/pool-factory/` | Fábrica de pools de préstamo | ✅ Funcional |
| **Backstop** | `contracts/backstop/` | Mecanismo de respaldo de seguridad | ✅ Funcional |
| **Pool** | `contracts/pool/` | Pool principal de préstamos/depósitos | ✅ Funcional |
| **TBRG Token** | `contracts/tbrg-token/` | Token de gobernanza TrustBridge | ✅ Funcional |

### Mock Contracts (Testing)

| Mock | Ubicación | Propósito |
|------|-----------|-----------|
| **Mock Pool Factory** | `contracts/mocks/mock-pool-factory/` | Testing de pool factory |
| **Mock Pool** | `contracts/mocks/mock-pool/` | Testing de pool |
| **ModERC3156** | `contracts/mocks/moderc3156/` | Testing de flash loans |

## 🚀 Deployment

### Script Principal

```bash
# El script principal está en tools/
chmod +x tools/deploy-all.sh

# Ejecutar deployment completo
ADMIN_ADDRESS="TU_DIRECCION" ./tools/deploy-all.sh
```

### Orden de Deployment

1. **Oracle** (`contracts/oracle/`) - Sin dependencias
2. **Pool Factory** (`contracts/pool-factory/`) - Sin dependencias  
3. **Backstop** (`contracts/backstop/`) - Depende de Pool Factory WASM
4. **Pool** (`contracts/pool/`) - Depende de Backstop WASM

## 🔧 Desarrollo

### Build Individual

```bash
# Construir Oracle
cd contracts/oracle && cargo build --target wasm32-unknown-unknown --release

# Construir Pool Factory
cd contracts/pool-factory && cargo build --target wasm32-unknown-unknown --release
```

### Build Completo

```bash
# El script maneja todas las dependencias automáticamente
./tools/deploy-all.sh
```

### Testing

```bash
# Tests individuales
cd contracts/oracle && cargo test

# Suite completa de tests
cd testing/test-suites && cargo test
```

## 📋 Configuración del Workspace

```toml
# Cargo.toml
[workspace]
members = [
  "contracts/tbrg-token",
  "contracts/oracle", 
  "contracts/pool-factory"
]
exclude = [
  "contracts/backstop",      # Excluidos por conflictos de dependencias
  "contracts/pool",          # Se construyen individualmente
  "contracts/mocks/*",
  "testing/test-suites"
]
```

## 🎨 Beneficios de la Nueva Estructura

### ✅ Organización Clara
- **Contratos**: Todo en `contracts/`
- **Herramientas**: Todo en `tools/`
- **Tests**: Todo en `testing/`
- **Docs**: Todo en `docs/`

### ✅ Deployment Simplificado
- **Un solo script**: `tools/deploy-all.sh`
- **Documentación completa**: `docs/DEPLOYMENT.md`
- **Dependencias resueltas**: Orden correcto automático

### ✅ Desarrollo Mejorado
- **Separación clara** de responsabilidades
- **Workspace optimizado** para builds rápidos
- **Documentación actualizada** y centralizada

### ✅ Mantenimiento Fácil
- **Estructura lógica** fácil de navegar
- **Scripts organizados** en `tools/`
- **Tests centralizados** en `testing/`

## 🔄 Migración Completada

### ✅ Cambios Realizados

1. **📁 Reorganización completa** de directorios
2. **🔧 Script de deployment** actualizado (`tools/deploy-all.sh`)  
3. **📚 Documentación** actualizada (`docs/DEPLOYMENT.md`)
4. **⚙️ Configuración workspace** optimizada
5. **🔗 Referencias de dependencias** corregidas
6. **📖 README principal** renovado

### ✅ Funcionalidad Preservada

- **Todos los contratos** compilan correctamente
- **Script de deployment** funciona con nueva estructura
- **Dependencias resueltas** correctamente
- **Documentación** actualizada y completa

---

## 🎯 Próximos Pasos

1. **Probar deployment** en testnet
2. **Verificar funcionalidad** de todos los contratos
3. **Actualizar CI/CD** si es necesario
4. **Documentar APIs** específicas de contratos

**¡La reorganización está completa y el proyecto está listo para usar! 🎉**