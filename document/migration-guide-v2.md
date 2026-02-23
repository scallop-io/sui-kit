# Migration Guide: v1.x to v2.0.0

This guide helps you migrate your project from sui-kit v1.x to v2.0.0.

## Breaking Changes Overview

### 1. Node.js Version Requirement

**v2.0.0 requires Node.js >= 22**

```bash
# Check your Node.js version
node --version

# If needed, upgrade Node.js to v22 or later
```

### 2. ESM-Only Package

v2.0.0 is now an ESM-only package. CommonJS support has been removed.

**Before (CommonJS):**
```javascript
const { SuiKit } = require('@scallop-io/sui-kit');
```

**After (ESM):**
```javascript
import { SuiKit } from '@scallop-io/sui-kit';
```

If your project uses CommonJS, you need to either:
- Convert your project to ESM by adding `"type": "module"` to `package.json`
- Use dynamic imports: `const { SuiKit } = await import('@scallop-io/sui-kit')`

### 3. Dependency Updates

v2.0.0 migrates to the latest Mysten SDK:

| Package | v1.x | v2.0.0 |
|---------|------|--------|
| @mysten/sui | ^1.x | ^2.0.0 |
| @mysten/bcs | ^1.x | ^2.0.0 |

### 4. Client Type Changes

The client type has changed from `SuiClient` to `ClientWithCoreApi`.

**Before:**
```typescript
import { SuiClient } from '@mysten/sui/client';
```

**After:**
```typescript
import { ClientWithCoreApi } from '@mysten/sui/client';
```

### 5. gRPC Support

v2.0.0 adds gRPC client support alongside the existing REST client.

**Using gRPC client:**
```typescript
import { SuiKit, SuiGrpcClient } from '@scallop-io/sui-kit';

// The SDK now supports gRPC for improved performance
const suiKit = new SuiKit({
  mnemonics: '<your-mnemonics>',
  networkType: 'mainnet',
});
```

### 6. New Exports

v2.0.0 exports additional utilities:

```typescript
import {
  SuiKit,
  SuiTxBlock,
  getFullnodeUrl,           // New in v2.0.0
  SimulateTransactionResponse // New in v2.0.0
} from '@scallop-io/sui-kit';
```

## Migration Steps

### Step 1: Update Node.js

Ensure you're running Node.js v22 or later.

### Step 2: Update package.json

```json
{
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "dependencies": {
    "@scallop-io/sui-kit": "^2.0.0"
  }
}
```

### Step 3: Update Import Statements

Convert all `require()` statements to ESM `import` syntax.

### Step 4: Update TypeScript Configuration (if applicable)

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

### Step 5: Test Your Application

Run your test suite to ensure everything works correctly:

```bash
npm test
```

## FAQ

### Q: Can I still use CommonJS?

A: No, v2.0.0 is ESM-only. You must migrate to ESM or use dynamic imports.

### Q: Is the API backward compatible?

A: Yes, the SuiKit API remains largely the same. The main changes are in the module system and underlying dependencies.

### Q: What are the benefits of v2.0.0?

- gRPC support for better performance
- Latest @mysten/sui SDK features
- Smaller bundle size with ESM
- Improved type definitions

## Need Help?

If you encounter issues during migration, please:
1. Check the [CHANGELOG](../CHANGELOG.md) for detailed changes
2. Open an issue on [GitHub](https://github.com/scallop-io/sui-kit/issues)
