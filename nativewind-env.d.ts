/// <reference types="nativewind/types" />

// Metro turns the Tailwind entry point into styles, not a module — TypeScript
// still wants to be told the side-effect import resolves to something.
declare module '*.css';
