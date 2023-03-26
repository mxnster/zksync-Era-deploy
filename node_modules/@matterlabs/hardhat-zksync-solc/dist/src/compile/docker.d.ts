import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import { CompilerInput } from 'hardhat/types';
import { ZkSolcConfig } from '../types';
export declare function dockerImage(imageName?: string, imageTag?: string): Image;
export declare function validateDockerIsInstalled(): Promise<void>;
export declare function createDocker(): Promise<HardhatDocker>;
export declare function pullImageIfNecessary(docker: HardhatDocker, image: Image): Promise<void>;
export declare function compileWithDocker(input: CompilerInput, docker: HardhatDocker, image: Image, zksolcConfig: ZkSolcConfig): Promise<any>;
export declare function getSolcVersion(docker: HardhatDocker, image: Image): Promise<string>;
//# sourceMappingURL=docker.d.ts.map