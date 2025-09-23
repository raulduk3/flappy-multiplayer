// Local augmentation / fallback types for ws when monorepo resolution fails
import 'ws';
// Re-export to ensure module is found by TS in strict monorepo context.
declare module 'ws' {}
