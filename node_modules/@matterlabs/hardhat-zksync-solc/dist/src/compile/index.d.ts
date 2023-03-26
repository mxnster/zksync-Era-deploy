import { ZkSolcConfig } from '../types';
import { HardhatDocker, Image } from '@nomiclabs/hardhat-docker';
import { CompilerInput } from 'hardhat/types';
export declare function compile(zksolcConfig: ZkSolcConfig, input: CompilerInput, solcPath?: string): Promise<any>;
export interface ICompiler {
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
}
export declare class BinaryCompiler implements ICompiler {
    solcPath: string;
    constructor(solcPath: string);
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
}
export declare class DockerCompiler implements ICompiler {
    dockerImage: Image;
    docker: HardhatDocker;
    protected constructor(dockerImage: Image, docker: HardhatDocker);
    static initialize(config: ZkSolcConfig): Promise<DockerCompiler>;
    compile(input: CompilerInput, config: ZkSolcConfig): Promise<any>;
    solcVersion(): Promise<{
        version: string;
        longVersion: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map