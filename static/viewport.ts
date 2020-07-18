import { VirtualizedPacket } from "./packet";

export class VirtualViewport {
	private fileSize: number;
	constructor(fileSize: number) {
		this.fileSize = fileSize;
		this.init();
		this.attachListeners();
	}
	private attachListeners(): void {
		// TODO
		// editor.keydown	// keyboard handler
		// editor.mouseover	// general mouseover handler
		// editor.mouseleave	// general mouseout handler
		// editor.click
		// window.resize	// doc resize handler
		// window.keydown	// window key-based scroll handler
	}
	public init(): void {
		// TODO
	}
	public render(packets: VirtualizedPacket[]): void {
		// TODO
		console.log("LX::SPH", "VIEW::RENDER", packets);
		let msg = [];
		for (let i = 0, l = packets.length; i < l; ++i) {
			// TODO
			msg.push(`Offset: ${packets[i].offset}`);
		}
		const cons = document.getElementById("rfn-console");
		if (cons) cons.innerHTML += '<p>' + (`(${packets.length})`) + (msg.join('<br/>') || 'No data received!') + '</p>';
	}
	public offsetTop(): number {
		// TODO
		return 0;
		// return (Math.floor(this.scrollBarHandler.virtualScrollTop / this.rowHeight) * 16);
	}
}