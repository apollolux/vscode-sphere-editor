import * as vscode from "vscode";
import { Disposable } from "./dispose";

// NOTE: heavily inspired by https://github.com/microsoft/vscode-hexeditor

/** Document edit-state for raw binary */
export interface SphereDocumentState {
	oldBytes: number | undefined;
	newBytes: number | undefined;
	readonly offset: number;
	sameOnDisk: boolean;
}

export class SphereDocument extends Disposable implements vscode.CustomDocument {
	static async create(
		uri: vscode.Uri,
		backupId: string | undefined
	): Promise< SphereDocument | PromiseLike<SphereDocument> > {
		// If we have a backup, read that. Otherwise read the resource from the workspace
		const dataFile = 'string' === typeof backupId ? vscode.Uri.parse(backupId) : uri;
		const unsavedEditURI = 'string' === typeof backupId ? vscode.Uri.parse(backupId + ".json") : undefined;
		const fileSize = (await vscode.workspace.fs.stat(dataFile)).size;
		let unsavedEdits: SphereDocumentState[] = [];
		// TODO: check against possible max size?
		// load the file
		const fileData = await vscode.workspace.fs.readFile(dataFile);
		if (unsavedEditURI) {
			const jsonData = await vscode.workspace.fs.readFile(unsavedEditURI);
			unsavedEdits = JSON.parse(Buffer.from(jsonData).toString('utf-8'));
		}
		return new SphereDocument(uri, fileData, fileSize, unsavedEdits);
	}

	private readonly _uri: vscode.Uri;
	private _size: number;
	private _data: Uint8Array;
	private _edits: SphereDocumentState[] = [];
	private _unsavedEdits: SphereDocumentState[] = [];

	private constructor(
		uri: vscode.Uri,
		initialData: Uint8Array,
		fileSize: number,
		unsavedEdits: SphereDocumentState[]
	) {
		super();
		this._uri = uri;
		this._data = initialData;
		this._size = fileSize;
		this._unsavedEdits = unsavedEdits;
		this._edits = Array.from(unsavedEdits);
		// console.log("LX::SPH", "DOC", this._uri, this._size);
		// console.log("LX::SPH", "DATA", this._data.slice(0, 8));
	}
	public get uri(): vscode.Uri { return this._uri; }
	public get data(): Uint8Array { return this._data; }
	public get unsavedEdits(): SphereDocumentState[] { return this._unsavedEdits; }
	public get filesize(): number {
		// TODO: go thru unsaved and calculate changes
		return this._size;
	}

	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	/** Fires when document is disposed */
	public readonly onDidDispose = this._onDidDispose.event;
	dispose(): void {
		this._onDidDispose.fire();
		super.dispose();
	}

	/** Open file regardless of filesize restrictions */
	async openAnyways(): Promise<void> {
		this._data = await vscode.workspace.fs.readFile(this.uri);
	}
	// public get unsaved

	private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
		readonly fileSize: number;
		readonly type: "redo" | "undo" | "revert";
		readonly content?: Uint8Array;
		readonly edits: readonly SphereDocumentState[];
	}>());
	/** Notify webviews when document is edited */
	public readonly onDidChangeContent = this._onDidChangeDocument.event;

	private readonly _onDidChange = this._register(new vscode.EventEmitter<{
		undo(): void;
		redo(): void;
	}>());
	/** Notify VS Code when a document is edited, update dirty bit */
	public readonly onDidChange = this._onDidChange.event;

	/** When an edit is made in the webview */
	makeEdit(edit: SphereDocumentState): void {
		this._edits.push(edit);
		this._unsavedEdits.push(edit);
		edit.sameOnDisk = false;

		this._onDidChange.fire({
			undo: async () => {
				const undoneEdit = this._edits.pop();
				// If undone edit is undefined then we didn't undo anything
				if (!undoneEdit) return;
				if (this._unsavedEdits[this._unsavedEdits.length - 1] === undoneEdit) {
					this._unsavedEdits.pop();
				}
				else if (undoneEdit.oldBytes === undefined) {
					this.unsavedEdits.push({
						newBytes: undefined,
						oldBytes: undoneEdit.newBytes,
						offset: undoneEdit.offset,
						sameOnDisk: undoneEdit.sameOnDisk
					});
				}
				// If the value is the same as what's on disk we want to let the webview know in order to mark a cell dirty
				undoneEdit.sameOnDisk = undoneEdit.oldBytes !== undefined && undoneEdit.oldBytes === this.data[undoneEdit.offset] || false;
				this._onDidChangeDocument.fire({
					fileSize: this.filesize,
					type: "undo",
					edits: [undoneEdit],
				});
			},
			redo: async () => {
				this._edits.push(edit);
				this._unsavedEdits.push(edit);
				const redoneEdit = edit;
				redoneEdit.sameOnDisk = redoneEdit.offset < this._size && redoneEdit.newBytes === this.data[redoneEdit.offset] || false;
				this._onDidChangeDocument.fire({
					fileSize: this.filesize,
					type: "redo",
					edits: [redoneEdit],
				});
			}
		});
	}

	/** Save the document */
	async save(cancelToken: vscode.CancellationToken): Promise<void> {
		// Map the edits into the document before saving
		const documentArray = Array.from(this.data);
		this._unsavedEdits.map((edit) => {
			// TODO: finish defining SphDocState for this etc +asr 20200702
			// if (edit.oldValue !== undefined && edit.newValue !== undefined) {
			// 	documentArray[edit.offset] = edit.newValue;
			// }
			// else if (edit.oldValue === undefined && edit.newValue !== undefined){
			// 	documentArray.push(edit.newValue);
			// }
			// else {
			// 	// If it was in the document and has since been removed we must remove it from the document data like so
			// 	documentArray.splice(edit.offset, 1);
			// }
			
			edit.sameOnDisk = true;
		});
		this._data = new Uint8Array(documentArray);
		this._size = this.data.length;
		await this.saveAs(this.uri, cancelToken);
		this._unsavedEdits = [];
	}

	/** Save to a new location */
	async saveAs(target: vscode.Uri, cancelToken: vscode.CancellationToken): Promise<void> {
		const fileData = this.data;
		if (cancelToken.isCancellationRequested) {
			return;
		}
		await vscode.workspace.fs.writeFile(target, fileData);
	}

	/** Revert to saved file on disk */
	async revert(_cancelToken: vscode.CancellationToken): Promise<void> {
		console.log("LX::SPH", "REV", _cancelToken);
		const diskContent = await vscode.workspace.fs.readFile(this.uri);
		this._size = diskContent.length;
		this._data = diskContent;
		this._unsavedEdits = [];
		// If we revert then the edits are exactly what's on the disk
		this._edits.map((e) => e.sameOnDisk = true);
		this._onDidChangeDocument.fire({
			fileSize: this.filesize,
			type: "revert",
			content: diskContent,
			edits: this._edits,
		});
	}

	/** Backup an edited document on hot exit */
	async backup(dest: vscode.Uri, cancelToken: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
		await this.saveAs(dest, cancelToken);
		await vscode.workspace.fs.writeFile(vscode.Uri.parse(dest.path + ".json"), Buffer.from(JSON.stringify(this.unsavedEdits), "utf-8"));
		return {
			id: dest.toString(),
			delete: async (): Promise<void> => {
				try {
					await vscode.workspace.fs.delete(dest);
					await vscode.workspace.fs.delete(vscode.Uri.parse(dest.path + ".json"));
				} catch(e) {
					// noop
				}
			}
		};
	}
}
