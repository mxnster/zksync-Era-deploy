import { ContainerConfig, Image, ProcessResult } from "./types";
export declare class HardhatDocker {
    static create(): Promise<HardhatDocker>;
    static isInstalled(): Promise<boolean>;
    static imageToRepoTag(image: Image): string;
    private readonly _docker;
    private constructor();
    isRunning(): Promise<boolean>;
    imageExists(image: Image): Promise<boolean>;
    hasPulledImage(image: Image): Promise<boolean>;
    isImageUpToDate(image: Image): Promise<boolean>;
    pullImage(image: Image): Promise<void>;
    runContainer(image: Image, command: string[], config?: ContainerConfig): Promise<ProcessResult>;
    private _validateBindsMap;
    private _withCommonErrors;
    private _bindsMapToArray;
    private _getRemoteImageId;
    private _getDockerRegistryTokenForImage;
    private _imageToRepositoryPath;
}
//# sourceMappingURL=hardhat-docker.d.ts.map