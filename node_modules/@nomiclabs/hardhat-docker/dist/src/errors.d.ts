import { Image } from "./types";
export declare class HardhatDockerError extends Error {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
}
export declare class DockerHubConnectionError extends HardhatDockerError {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
}
export declare class DockerNotInstalledError extends HardhatDockerError {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
}
export declare class DockerNotRunningError extends HardhatDockerError {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
}
export declare class DockerBadGatewayError extends HardhatDockerError {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
}
export declare class ImageDoesntExistError extends HardhatDockerError {
    readonly image: Image;
    readonly parent?: Error | undefined;
    constructor(image: Image, parent?: Error | undefined);
}
export declare class BindDoesntExistInHostError extends HardhatDockerError {
    readonly path: string;
    constructor(path: string);
}
export declare class DockerServerError extends HardhatDockerError {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
    getServerErrorMessage(): any;
}
export declare class ExecutableNotFoundError extends HardhatDockerError {
    readonly parent?: Error | undefined;
    constructor(parent?: Error | undefined);
}
//# sourceMappingURL=errors.d.ts.map