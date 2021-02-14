import { vscode } from "./global";
import { Messenger } from "./bundle";

function postEdits(edits: any[]): void {
	let aggMsg: any[] = [];
	for (const edit of edits) {
		// TODO: push reformatted edit to aggMsg
		// const oldV = edit.prev || undefined;
		// const newV = edit.now || undefined;
		// const msg = { offset, oldData, newData, sameOnDisk }
		// aggMsg.push(msg);
	}
	// TODO: msgr.postMessageWithResponse("edit", aggMsg);
	Messenger.postMessageWithResponse("edit", {
		// TODO
		"edits": aggMsg
	});
}