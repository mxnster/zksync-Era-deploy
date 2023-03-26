"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileWithBinary = void 0;
const child_process_1 = require("child_process");
const utils_1 = require("../utils");
async function compileWithBinary(input, config, solcPath) {
    const compilerPath = config.settings.compilerPath || (await (0, utils_1.getZksolcPath)(config.version));
    const isSystem = config.settings.isSystem;
    const forceEvmla = config.settings.forceEvmla;
    const output = await new Promise((resolve, reject) => {
        const process = (0, child_process_1.exec)(`${compilerPath} --standard-json  ${isSystem ? '--system-mode' : ''} ${forceEvmla ? '--force-evmla' : ''} --solc ${solcPath}`, {
            maxBuffer: 1024 * 1024 * 500,
        }, (err, stdout, _stderr) => {
            if (err !== null) {
                return reject(err);
            }
            resolve(stdout);
        });
        process.stdin.write(JSON.stringify(input));
        process.stdin.end();
    });
    return JSON.parse(output);
}
exports.compileWithBinary = compileWithBinary;
//# sourceMappingURL=binary.js.map