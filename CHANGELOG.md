# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.7.0](https://github.com/scallop-io/sui-kit/compare/v1.3.0...v1.7.0) (2024-08-29)

### Features

- Upgrade `@mysten/sui` sdk to 1.7.0 and other related packages ([f17e669](https://github.com/scallop-io/sui-kit/pull/33/commits/f17e669099550854ead93edd37f70eafc5400456))

### [1.3.0](https://github.com/scallop-io/sui-kit/compare/v1.0.1...v1.3.0) (2024-07-25)

### Features

- Update `mysten/sui` sdk ([c0a4691](https://github.com/scallop-io/sui-kit/pull/31/commits/c0a469153b306f4502f8634ee3a49a63b33ba6e1))
- Bump version to match `mysten/sui` version

### [1.0.2](https://github.com/scallop-io/sui-kit/compare/v1.0.1...v1.0.2) (2024-07-12)

### Bug Fixes

- Add `number` and `bigint` check on `convertArgs` ([c73ccb3](https://github.com/scallop-io/sui-kit/pull/30/commits/c73ccb34840e6556e0aaf45ea978a7db99056a6b))
- Fix types and `pure` getter on `SuiTxBlock` ([6cae48f](https://github.com/scallop-io/sui-kit/pull/30/commits/6cae48f1898d91ced89c0446804196efc9c0daa2))

### [1.0.1](https://github.com/scallop-io/sui-kit/compare/v1.0.0...v1.0.1) (2024-07-12)

### Bug Fixes

- Minor fixes ([060761c](https://github.com/scallop-io/sui-kit/pull/28/commits/060761cc32f6c13b541c08c367e1c37ccaad3f2e))

### [1.0.0](https://github.com/scallop-io/sui-kit/compare/v0.45.0...v1.0.0) (2024-07-9)

### ⚠ BREAKING CHANGES

- Upgrade to `@mysten/sui@1` (https://github.com/scallop-io/sui-kit/pull/23)

### [0.52.0](https://github.com/scallop-io/sui-kit/compare/v0.45.0...v0.52.0) (2024-06-14)

### Features

- Add `balance` property to `selectCoins` method in `SuiInteractor` class ([c61c7d8](https://github.com/scallop-io/sui-kit/pull/24/commits/c61c7d86e86bfb213271b9c7c4c32768a072df7f))
- Match version number with `mysten/sui.js` library version

### [0.44.45](https://github.com/scallop-io/sui-kit/compare/v0.44.2...v0.45.0) (2024-05-14)

### [0.44.2](https://github.com/scallop-io/sui-kit/compare/v0.44.1...v0.44.2) (2023-12-30)

### Bug Fixes

- correct VecArg for convertArgs ([c213a7b](https://github.com/scallop-io/sui-kit/commit/c213a7bf670ecb28ad8698b130e27e0240fedd36))

## [0.44.0](https://github.com/scallop-io/sui-kit/compare/v0.42.2...v0.44.0) (2023-10-22)

## [0.42.0](https://github.com/scallop-io/sui-kit/compare/v0.41.0...v0.42.0) (2023-09-27)

### ⚠ BREAKING CHANGES

- change `JsonRpcProvider` to `SuiClient`, and change `getSinger` to `getKeypair` in SuiKit class

### Features

- export transactions from sui sdk ([4bfa0f2](https://github.com/scallop-io/sui-kit/commit/4bfa0f2580c34592bcb7b0b507d94e6daa1f00bc))

- upgrade sui sdk to refactored version ([925f731](https://github.com/scallop-io/sui-kit/commit/925f73138501a40b650059be8d3601b5144cd08f))
