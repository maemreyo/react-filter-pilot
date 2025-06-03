# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.20] - 2025-01-03

### 🚀 **Major Build System Upgrade**

#### **Changed**
- **BREAKING**: Migrated from Rollup to tsup for faster, more reliable builds
- **Build Performance**: 10x faster build times (159ms vs 1000ms+)
- **Zero Config**: Simplified build configuration with tsup
- **Console Removal**: Guaranteed console log removal in production builds

#### **Fixed**
- **Cache Issues**: Eliminated Rollup cache problems that prevented proper rebuilds
- **Console Logs**: Fixed console logs leaking into production builds
- **TypeScript**: Improved TypeScript declaration generation

#### **Technical Details**
- Added `tsup.config.ts` with optimized settings
- Updated build scripts to use tsup
- Enhanced minification with esbuild
- Better tree-shaking and code splitting
- Improved source map generation

#### **Migration Notes**
- No API changes - fully backward compatible
- Faster development builds with `pnpm dev`
- More reliable production builds
- Better debugging with improved source maps

## [Unreleased]

### Added
- Complete TypeScript rewrite with full type safety
- TanStack Query v5 support alongside v4
- New `useFilterPilotInfinite` hook for infinite scrolling
- New `useFilterMutation` hook for data mutations with optimistic updates
- Next.js Pages Router adapter
- Universal adapters (hash routing, memory routing, custom)
- Test utilities for easier testing
- Comprehensive documentation and examples
- Filter presets with localStorage persistence
- Individual filter reset functionality
- Query compatibility layer for TanStack Query v4/v5

### Changed
- Improved performance with better memoization
- Enhanced URL synchronization with better encoding
- More flexible filter configurations
- Better error handling and recovery

### Fixed
- Race conditions in rapid filter changes
- Memory leaks in cleanup
- URL encoding issues with special characters

## [0.1.0] - 2024-01-15

### Added
- Initial release
- Core `useFilterPilot` hook
- Filter state management with debouncing
- Pagination support
- Sorting functionality
- URL synchronization
- React Router DOM adapter
- Next.js App Router adapter
- Basic documentation

[Unreleased]: https://github.com/yourusername/react-filter-pilot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/react-filter-pilot/releases/tag/v0.1.0