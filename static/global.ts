/**
 * global.ts
 * Structs common to extension front-end and back-end
 * @author Alex Rosario
 */


/** @returns vscode reduced API object */
declare const acquireVsCodeApi: any;
/** vscode { postMessage(...), getState(...), setState(...) } */
export const vscode = acquireVsCodeApi();


// TODO: general doc state
// TODO: format-specific doc state
// TODO: msg packet formats
