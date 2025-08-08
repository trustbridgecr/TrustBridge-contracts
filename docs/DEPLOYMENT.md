# TrustBridge Deployment Guide

Esta guía te ayudará a deployar todos los contratos de TrustBridge usando el script automatizado `tools/deploy-all.sh`.

## Prerequisitos

### 1. Herramientas Necesarias

- **Rust** (versión 1.89.0 o superior)
- **Stellar CLI** (versión compatible)
- **wasm32-unknown-unknown target**

```bash
# Instalar target WASM
rustup target add wasm32-unknown-unknown

# Verificar instalación
rustc --version
stellar --version
```

### 2. Configuración de Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
# Mínimo requerido: ADMIN_ADDRESS
nano .env
```

### 3. Configuración de Cuentas

Antes de deployar, necesitas configurar una cuenta de Stellar:

```bash
# Generar nueva identidad
stellar keys generate alice

# O usar una existente
stellar keys address alice

# Fondear cuenta en testnet
stellar keys fund alice --network testnet

# Verificar fondos
stellar keys address alice  # Copia la dirección para usar como ADMIN_ADDRESS
```

## Uso del Script de Deployment

### Comando Básico

```bash
ADMIN_ADDRESS="TU_DIRECCION_AQUI" ./tools/deploy-all.sh
```

### Ejemplo Completo

```bash
# Hacer executable el script
chmod +x tools/deploy-all.sh

# Deploy con dirección específica
ADMIN_ADDRESS="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5" ./tools/deploy-all.sh
```

### Variables de Entorno Opcionales

```bash
# Personalizar configuración
NETWORK="testnet" \
SOURCE_ACCOUNT="alice" \
ADMIN_ADDRESS="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5" \
ORACLE_ADMIN="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5" \
./tools/deploy-all.sh
```

## Proceso de Deployment

El script `deploy-all.sh` ejecuta automáticamente:

### 1. Compilación en Orden de Dependencias

```bash
🔨 Building contracts in dependency order...
🔨 Building oracle...        # Sin dependencias
🔨 Building pool-factory...  # Sin dependencias  
🔨 Building backstop...      # Depende de pool-factory WASM
🔨 Building pool...          # Depende de backstop WASM
```

### 2. Deployment Secuencial

1. **Oracle Contract**
   - Deploy del contrato Oracle
   - Inicialización con admin address
   
2. **Pool Factory Contract**
   - Deploy del contrato Pool Factory
   
3. **Backstop Contract**
   - Deploy del contrato Backstop
   
4. **Pool Creation**
   - Uso del Pool Factory para crear un pool
   - Configuración con Oracle y Backstop

### 3. Guardado de Información

Se crean dos archivos automáticamente:

- **`deployment.json`** - Información detallada
- **`deployment.env`** - Variables de entorno

## Archivos Generados

### deployment.json
```json
{
  "network": "testnet",
  "admin": "GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5",
  "oracle_admin": "GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5",
  "contracts": {
    "oracle": "CCR6QKTWZQYW6YUJ7UP7XXZRLWQPFRV6SWBLQS4ZQOSAF4BOUD77OTE2",
    "pool_factory": "CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ",
    "backstop": "CBQHN5LLKXVHFHXS4BKG2SDTYQGSZM7XN2EUKX75BTT42JVJF2H4VDMK",
    "pool": "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGEXE"
  },
  "deployed_at": "2024-08-08T10:30:45Z"
}
```

### deployment.env
```bash
# TrustBridge Deployment Addresses
# Generated on Thu Aug 8 10:30:45 2024

export TRUSTBRIDGE_ORACLE_ID="CCR6QKTWZQYW6YUJ7UP7XXZRLWQPFRV6SWBLQS4ZQOSAF4BOUD77OTE2"
export TRUSTBRIDGE_POOL_FACTORY_ID="CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ"
export TRUSTBRIDGE_BACKSTOP_ID="CBQHN5LLKXVHFHXS4BKG2SDTYQGSZM7XN2EUKX75BTT42JVJF2H4VDMK"
export TRUSTBRIDGE_POOL_ID="CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGEXE"
export TRUSTBRIDGE_NETWORK="testnet"
export TRUSTBRIDGE_ADMIN="GBZXN7PIRZGNMHGA7MUUUF4GWJQ5UW5FWVD2URXVPE4YKBXXKBJQT3J5"
```

## Uso de Contratos Deployados

### Cargar Variables de Entorno

```bash
# Cargar direcciones de contratos
source deployment.env

# Verificar variables
echo $TRUSTBRIDGE_ORACLE_ID
echo $TRUSTBRIDGE_POOL_ID
```

### Interactuar con Contratos

#### Oracle Contract
```bash
# Set price
stellar contract invoke \
  --id $TRUSTBRIDGE_ORACLE_ID \
  --source alice \
  --network testnet \
  -- \
  set_price \
  --asset '{"Stellar":"CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ"}' \
  --price 10000000

# Get price  
stellar contract invoke \
  --id $TRUSTBRIDGE_ORACLE_ID \
  --source alice \
  --network testnet \
  -- \
  lastprice \
  --asset '{"Stellar":"CDLZFC3SHJYDEH7GIWEX4XTY52YHQHQKD5GFSAQ5FDKR2R4XFQXC2QXJ"}'
```

#### Pool Contract
```bash
# Submit request to pool
stellar contract invoke \
  --id $TRUSTBRIDGE_POOL_ID \
  --source alice \
  --network testnet \
  -- \
  submit \
  --from alice \
  --spender alice \
  --to alice \
  --requests '[...]'
```

## Troubleshooting

### Errores Comunes

#### "XDR value invalid"
```bash
# Problema: Incompatibilidad de versiones
# Solución: Verificar compatibilidad entre CLI y SDK

stellar --version  # Debe ser compatible con soroban-sdk utilizado
```

#### "Account not found"
```bash
# Problema: Cuenta sin fondos
# Solución: Fondear cuenta

stellar keys fund alice --network testnet
```

#### "Contract not found"
```bash
# Problema: Dependencias no compiladas correctamente
# Solución: Limpiar y recompilar

rm -rf target */target
./tools/deploy-all.sh
```

### Logs y Debug

Para obtener más información de debug:

```bash
# Ejecutar con logs verbosos
RUST_LOG=debug ADMIN_ADDRESS="..." ./tools/deploy-all.sh

# Verificar estado de la red
stellar network ls

# Verificar cuenta específica  
stellar keys address alice
```

## Redes Disponibles

### Testnet (Recomendada para pruebas)
```bash
NETWORK="testnet" ./tools/deploy-all.sh
```

### Futurenet (Para features experimentales)
```bash  
NETWORK="futurenet" ./tools/deploy-all.sh
```

### Mainnet (Solo para producción)
```bash
NETWORK="mainnet" ./tools/deploy-all.sh
```

## Post-Deployment

### 1. Verificar Contratos

Visita Stellar Explorer para verificar los contratos:

- Oracle: `https://stellar.expert/explorer/testnet/contract/{ORACLE_ID}`
- Pool Factory: `https://stellar.expert/explorer/testnet/contract/{POOL_FACTORY_ID}`
- Backstop: `https://stellar.expert/explorer/testnet/contract/{BACKSTOP_ID}`
- Pool: `https://stellar.expert/explorer/testnet/contract/{POOL_ID}`

### 2. Configuración Inicial

1. **Configurar precios en Oracle**
2. **Establecer reservas en Pool** 
3. **Probar funcionalidad básica**

### 3. Siguiente Pasos

- Configure reserves in the pool
- Set initial prices in the oracle
- Test the deployment

## Seguridad

⚠️ **Importantes consideraciones de seguridad:**

- **Nunca compartas tu private key**
- **Usa addresses dedicadas para admin**
- **Verifica todas las transacciones antes de firmar**
- **Guarda de forma segura deployment.json y deployment.env**
- **Usa testnet antes de mainnet**

## Soporte

Si encuentras problemas:

1. Revisa la sección [Troubleshooting](#troubleshooting)
2. Verifica la configuración de prerequisitos
3. Consulta los logs de deployment
4. Crea un issue en el repositorio