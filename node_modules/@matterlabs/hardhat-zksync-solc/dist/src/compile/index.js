"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerCompiler = exports.BinaryCompiler = exports.compile = void 0;
const binary_1 = require("./binary");
const docker_1 = require("./docker");
const errors_1 = require("../errors");
async function compile(zksolcConfig, input, solcPath) {
    let compiler;
    if (zksolcConfig.compilerSource == 'binary') {
        if (solcPath == null) {
            throw new errors_1.ZkSyncSolcPluginError('solc executable is not specified');
        }
        compiler = new BinaryCompiler(solcPath);
    }
    else if (zksolcConfig.compilerSource == 'docker') {
        compiler = await DockerCompiler.initialize(zksolcConfig);
    }
    else {
        throw new errors_1.ZkSyncSolcPluginError(`Incorrect compiler source: ${zksolcConfig.compilerSource}`);
    }
    return await compiler.compile(input, zksolcConfig);
}
exports.compile = compile;
class BinaryCompiler {
    constructor(solcPath) {
        this.solcPath = solcPath;
    }
    async compile(input, config) {
        return await (0, binary_1.compileWithBinary)(input, config, this.solcPath);
    }
}
exports.BinaryCompiler = BinaryCompiler;
class DockerCompiler {
    constructor(dockerImage, docker) {
        this.dockerImage = dockerImage;
        this.docker = docker;
    }
    static async initialize(config) {
        var _a, _b;
        await (0, docker_1.validateDockerIsInstalled)();
        const image = (0, docker_1.dockerImage)((_a = config.settings.experimental) === null || _a === void 0 ? void 0 : _a.dockerImage, (_b = config.settings.experimental) === null || _b === void 0 ? void 0 : _b.tag);
        const docker = await (0, docker_1.createDocker)();
        await (0, docker_1.pullImageIfNecessary)(docker, image);
        return new DockerCompiler(image, docker);
    }
    async compile(input, config) {
        return await (0, docker_1.compileWithDocker)(input, this.docker, this.dockerImage, config);
    }
    async solcVersion() {
        const versionOutput = await (0, docker_1.getSolcVersion)(this.docker, this.dockerImage);
        const longVersion = versionOutput.match(/^Version: (.*)$/)[1];
        const version = longVersion.split('+')[0];
        return { version, longVersion };
    }
}
exports.DockerCompiler = DockerCompiler;
//# sourceMappingURL=index.js.map