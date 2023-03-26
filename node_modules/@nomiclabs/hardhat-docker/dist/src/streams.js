"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritableBufferStream = void 0;
const stream_1 = require("stream");
/**
 * This class is a writable stream that buffers everything written into it, and
 * keeps it in its [[buffer]] field.
 */
class WritableBufferStream extends stream_1.Writable {
    constructor() {
        super({
            write: (chunk, encoding, next) => {
                this.buffer = Buffer.concat([this.buffer, chunk]);
                next();
            },
        });
        this.buffer = Buffer.from([]);
    }
}
exports.WritableBufferStream = WritableBufferStream;
//# sourceMappingURL=streams.js.map