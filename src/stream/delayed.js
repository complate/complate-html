import BufferedStream from "./buffered";

// pseudo-stream, buffering contents to be consumed afterwards as a single string
export default class DelayedStream extends BufferedStream {
	flush() {
		this.flushed = true;
	}

	apply(stream) {
		stream.write(this.read());
		if(this.flushed) {
			stream.flush();
		}
	}
}
