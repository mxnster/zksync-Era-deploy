"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolcVersion = exports.compileWithDocker = exports.pullImageIfNecessary = exports.createDocker = exports.validateDockerIsInstalled = exports.dockerImage = void 0;
const hardhat_docker_1 = require("@nomiclabs/hardhat-docker");
const stream_1 = require("stream");
const errors_1 = require("../errors");
const chalk_1 = __importDefault(require("chalk"));
async function runContainer(docker, image, command, input) {
    const createOptions = {
        Tty: false,
        AttachStdin: true,
        OpenStdin: true,
        StdinOnce: true,
        HostConfig: {
            AutoRemove: true,
        },
        Cmd: command,
        Image: hardhat_docker_1.HardhatDocker.imageToRepoTag(image),
    };
    const container = await docker.createContainer(createOptions);
    let output = Buffer.from('');
    let chunk = Buffer.from('');
    const stream = new stream_1.Writable({
        write: function (incoming, _encoding, next) {
            // Please refer to the 'Stream format' chapter at
            // https://docs.docker.com/engine/api/v1.37/#operation/ContainerAttach
            // to understand the details of this implementation.
            chunk = Buffer.concat([chunk, incoming]);
            let size = chunk.readUInt32BE(4);
            while (chunk.byteLength >= 8 + size) {
                output = Buffer.concat([output, chunk.slice(8, 8 + size)]);
                chunk = chunk.slice(8 + size);
                if (chunk.byteLength >= 8) {
                    size = chunk.readUInt32BE(4);
                }
            }
            next();
        },
    });
    const dockerStream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true,
        hijack: true,
    });
    dockerStream.pipe(stream);
    await container.start();
    dockerStream.end(input);
    await container.wait();
    return output.toString('utf8');
}
function dockerImage(imageName, imageTag) {
    if (!imageName) {
        throw new errors_1.ZkSyncSolcPluginError('Docker source was chosen but no image was specified');
    }
    return {
        repository: imageName,
        tag: imageTag || 'latest',
    };
}
exports.dockerImage = dockerImage;
async function validateDockerIsInstalled() {
    if (!(await hardhat_docker_1.HardhatDocker.isInstalled())) {
        throw new errors_1.ZkSyncSolcPluginError('Docker Desktop is not installed.\n' +
            'Please install it by following the instructions on https://www.docker.com/get-started');
    }
}
exports.validateDockerIsInstalled = validateDockerIsInstalled;
async function createDocker() {
    return await handleCommonErrors(hardhat_docker_1.HardhatDocker.create());
}
exports.createDocker = createDocker;
async function pullImageIfNecessary(docker, image) {
    await handleCommonErrors(pullImageIfNecessaryInner(docker, image));
}
exports.pullImageIfNecessary = pullImageIfNecessary;
async function pullImageIfNecessaryInner(docker, image) {
    if (!(await docker.hasPulledImage(image))) {
        console.info(chalk_1.default.yellow(`Pulling Docker image ${hardhat_docker_1.HardhatDocker.imageToRepoTag(image)}...`));
        await docker.pullImage(image);
        console.info(chalk_1.default.green(`Image pulled`));
    }
    else {
        await checkForImageUpdates(docker, image);
    }
}
async function checkForImageUpdates(docker, image) {
    if (!(await docker.isImageUpToDate(image))) {
        console.info(chalk_1.default.yellow(`Updating Docker image ${hardhat_docker_1.HardhatDocker.imageToRepoTag(image)}...`));
        await docker.pullImage(image);
        console.info(chalk_1.default.green(`Image updated`));
    }
}
async function compileWithDocker(input, docker, image, zksolcConfig) {
    const command = ['zksolc', '--standard-json'];
    if (zksolcConfig.settings.isSystem) {
        command.push('--system-mode');
    }
    if (zksolcConfig.settings.forceEvmla) {
        command.push('--force-evmla');
    }
    // @ts-ignore
    const dockerInstance = docker._docker;
    return await handleCommonErrors((async () => {
        const compilerOutput = await runContainer(dockerInstance, image, command, JSON.stringify(input));
        try {
            return JSON.parse(compilerOutput);
        }
        catch (_a) {
            throw new errors_1.ZkSyncSolcPluginError(compilerOutput);
        }
    })());
}
exports.compileWithDocker = compileWithDocker;
async function getSolcVersion(docker, image) {
    // @ts-ignore
    const dockerInstance = docker._docker;
    return await handleCommonErrors((async () => {
        const versionOutput = await runContainer(dockerInstance, image, ['solc', '--version'], '');
        return versionOutput.split('\n')[1];
    })());
}
exports.getSolcVersion = getSolcVersion;
async function handleCommonErrors(promise) {
    try {
        return await promise;
    }
    catch (error) {
        if (error instanceof hardhat_docker_1.DockerNotRunningError || error instanceof hardhat_docker_1.DockerBadGatewayError) {
            throw new errors_1.ZkSyncSolcPluginError('Docker Desktop is not running.\nPlease open it and wait until it finishes booting.', error);
        }
        if (error instanceof hardhat_docker_1.DockerHubConnectionError) {
            throw new errors_1.ZkSyncSolcPluginError('Error connecting to Docker Hub.\nPlease check your internet connection.', error);
        }
        if (error instanceof hardhat_docker_1.DockerServerError) {
            throw new errors_1.ZkSyncSolcPluginError('Docker error', error);
        }
        if (error instanceof hardhat_docker_1.ImageDoesntExistError) {
            throw new errors_1.ZkSyncSolcPluginError(`Docker image ${hardhat_docker_1.HardhatDocker.imageToRepoTag(error.image)} doesn't exist.\n` +
                'Make sure you chose a valid zksolc version.');
        }
        throw error;
    }
}
//# sourceMappingURL=docker.js.map