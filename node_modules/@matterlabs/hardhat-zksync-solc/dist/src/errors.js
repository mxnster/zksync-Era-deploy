"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkSyncSolcPluginError = void 0;
const plugins_1 = require("hardhat/plugins");
const constants_1 = require("./constants");
class ZkSyncSolcPluginError extends plugins_1.HardhatPluginError {
    constructor(message, parentError) {
        super(constants_1.PLUGIN_NAME, message, parentError);
    }
}
exports.ZkSyncSolcPluginError = ZkSyncSolcPluginError;
//# sourceMappingURL=errors.js.map