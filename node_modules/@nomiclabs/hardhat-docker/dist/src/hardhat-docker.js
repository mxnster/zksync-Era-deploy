"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardhatDocker = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const errors_1 = require("./errors");
const streams_1 = require("./streams");
const DOCKER_SOCKET_PATH = "/var/run/docker.sock";
class HardhatDocker {
    // The constructor is private, see [[HardhatDocker.create]].
    constructor(DockerImpl) {
        // TODO: This doesn't support windows
        this._docker = new DockerImpl({ socketPath: DOCKER_SOCKET_PATH });
    }
    static async create() {
        if (!(await HardhatDocker.isInstalled())) {
            throw new errors_1.DockerNotInstalledError();
        }
        // TODO: This doesn't support windows
        if (!(await fs_extra_1.default.pathExists(DOCKER_SOCKET_PATH))) {
            throw new errors_1.DockerNotRunningError();
        }
        const { default: DockerImpl } = await Promise.resolve().then(() => __importStar(require("dockerode")));
        return new HardhatDocker(DockerImpl);
    }
    static async isInstalled() {
        // TODO: This doesn't support windows
        const { exec } = await Promise.resolve().then(() => __importStar(require("child_process")));
        return new Promise((resolve) => {
            exec("which docker", (error) => resolve(!error));
        });
    }
    static imageToRepoTag(image) {
        return `${image.repository}:${image.tag}`;
    }
    async isRunning() {
        try {
            const result = await this._withCommonErrors(this._docker.ping());
            return result === "OK";
        }
        catch (error) {
            if (error instanceof errors_1.DockerNotRunningError) {
                return false;
            }
            if (error instanceof errors_1.DockerBadGatewayError) {
                return false;
            }
            throw error;
        }
    }
    async imageExists(image) {
        const repositoryPath = this._imageToRepositoryPath(image);
        const imageEndpoint = `https://registry.hub.docker.com/v2/repositories/${repositoryPath}/tags/${image.tag}/`;
        try {
            const { default: fetch } = await Promise.resolve().then(() => __importStar(require("node-fetch")));
            const res = await fetch(imageEndpoint);
            // Consume the response stream and discard its result
            // See: https://github.com/node-fetch/node-fetch/issues/83
            const _discarded = await res.text();
            return res.ok;
        }
        catch (error) {
            throw new errors_1.DockerHubConnectionError(error);
        }
    }
    async hasPulledImage(image) {
        const images = await this._withCommonErrors(this._docker.listImages());
        return images.some((img) => img.RepoTags !== null &&
            img.RepoTags.some((repoAndTag) => repoAndTag === HardhatDocker.imageToRepoTag(image)));
    }
    async isImageUpToDate(image) {
        const images = await this._withCommonErrors(this._docker.listImages());
        const imageInfo = images.find((img) => img.RepoTags !== null &&
            img.RepoTags.some((repoAndTag) => repoAndTag === HardhatDocker.imageToRepoTag(image)));
        if (imageInfo === undefined) {
            return false;
        }
        const remoteId = await this._getRemoteImageId(image);
        return imageInfo.Id === remoteId;
    }
    async pullImage(image) {
        if (!(await this.imageExists(image))) {
            throw new errors_1.ImageDoesntExistError(image);
        }
        const im = await this._withCommonErrors(this._docker.pull(HardhatDocker.imageToRepoTag(image), {}));
        return new Promise((resolve, reject) => {
            im.on("end", resolve);
            im.on("error", reject);
            // Not having the data handler causes the process to exit
            im.on("data", () => { });
        });
    }
    async runContainer(image, command, config = {}) {
        await this._validateBindsMap(config.binds);
        const createOptions = {
            Tty: false,
            WorkingDir: config.workingDirectory,
            Entrypoint: "",
            HostConfig: {
                AutoRemove: true,
                Binds: this._bindsMapToArray(config.binds),
                NetworkMode: config.networkMode,
            },
        };
        const stdout = new streams_1.WritableBufferStream();
        const stderr = new streams_1.WritableBufferStream();
        const container = await this._withCommonErrors(this._docker.run(HardhatDocker.imageToRepoTag(image), command, [stdout, stderr], createOptions));
        return {
            statusCode: container.output.StatusCode,
            stdout: stdout.buffer,
            stderr: stderr.buffer,
        };
    }
    async _validateBindsMap(map) {
        if (map === undefined) {
            return;
        }
        for (const hostPath of Object.keys(map)) {
            if (!(await fs_extra_1.default.pathExists(hostPath))) {
                throw new errors_1.BindDoesntExistInHostError(hostPath);
            }
        }
    }
    async _withCommonErrors(promise) {
        try {
            return await promise;
        }
        catch (error) {
            if (error.code === "ECONNREFUSED") {
                throw new errors_1.DockerNotRunningError(error);
            }
            if (error.statusCode === 502) {
                throw new errors_1.DockerBadGatewayError(error);
            }
            if (error.statusCode === 500) {
                throw new errors_1.DockerServerError(error);
            }
            if (error.statusCode === 400 &&
                error.message !== undefined &&
                error.message.includes("executable file not found")) {
                throw new errors_1.ExecutableNotFoundError(error);
            }
            throw error;
        }
    }
    _bindsMapToArray(map) {
        if (map === undefined) {
            return [];
        }
        return Object.entries(map).map(([host, container]) => `${host}:${container}`);
    }
    async _getRemoteImageId(image) {
        const token = await this._getDockerRegistryTokenForImage(image);
        const endpoint = `https://registry-1.docker.io/v2/${this._imageToRepositoryPath(image)}/manifests/${image.tag}`;
        try {
            const { default: fetch } = await Promise.resolve().then(() => __importStar(require("node-fetch")));
            const res = await fetch(endpoint, {
                headers: {
                    Accept: "application/vnd.docker.distribution.manifest.v2+json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error(`Docker Registry manifest request not successful ${await res.text()}`);
            }
            const json = await res.json();
            return json.config.digest;
        }
        catch (error) {
            throw new errors_1.DockerHubConnectionError(error);
        }
    }
    async _getDockerRegistryTokenForImage(image) {
        const endpoint = `https://auth.docker.io/token?scope=repository:${this._imageToRepositoryPath(image)}:pull&service=registry.docker.io`;
        try {
            const { default: fetch } = await Promise.resolve().then(() => __importStar(require("node-fetch")));
            const res = await fetch(endpoint);
            if (!res.ok) {
                throw new Error(`Docker Registry auth request not successful ${await res.text()}`);
            }
            const json = await res.json();
            return json.token;
        }
        catch (error) {
            throw new errors_1.DockerHubConnectionError(error);
        }
    }
    _imageToRepositoryPath(image) {
        return image.repository.includes("/")
            ? image.repository
            : `library/${image.repository}`;
    }
}
exports.HardhatDocker = HardhatDocker;
//# sourceMappingURL=hardhat-docker.js.map