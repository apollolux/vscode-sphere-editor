/**
 * util.ts
 */

import * as vscode from "vscode";
import { TextDecoder } from "util";

const TXD = new TextDecoder('utf-8');

export async function readTextFile(uri: vscode.Uri): Promise<string> {
	const f = await vscode.workspace.fs.readFile(uri);
	return TXD.decode(f);
}

 /**
 * util.ts : getNonce
 * Copyright (c) Microsoft Corporation.
 * Licensed under the MIT license.
 */

 /** A nonce generator for unique identification */
export function getNonce(length: number = 32): string {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < length; i++) {
		text += possible.charAt((Math.random() * possible.length)|0);
	}
	return text;
}
