/// <reference types="node" />
import { Writable } from "stream";
/**
 * This class is a writable stream that buffers everything written into it, and
 * keeps it in its [[buffer]] field.
 */
export declare class WritableBufferStream extends Writable {
    buffer: Buffer;
    constructor();
}
//# sourceMappingURL=streams.d.ts.map