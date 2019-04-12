import BufferedStream from "./buffered_stream";

// pseudo-stream, buffering contents to be consumed afterwards as a single string
export default class DelayedStream extends BufferedStream {
	constructor(stream) {
		super();
		this.stream = stream;
		this.flushed = false;
	}

	flush() {
		this.flushed = true;
	}

	apply() {
		this.stream.write(this.read());
		if(this.flushed) {
			this.stream.flush();
		}
	}
}
