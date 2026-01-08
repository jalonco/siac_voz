declare module 'prismjs/components/prism-core' {
    export const highlight: (code: string, grammar: any, language: string) => string;
    export const languages: any;
}
