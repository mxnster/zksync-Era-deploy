"use strict";
// For an explanation about these classes constructors go to:
// https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutableNotFoundError = exports.DockerServerError = exports.BindDoesntExistInHostError = exports.ImageDoesntExistError = exports.DockerBadGatewayError = exports.DockerNotRunningError = exports.DockerNotInstalledError = exports.DockerHubConnectionError = exports.HardhatDockerError = void 0;
class HardhatDockerError extends Error {
    constructor(parent) {
        super();
        this.parent = parent;
        Object.setPrototypeOf(this, HardhatDockerError.prototype);
    }
}
exports.HardhatDockerError = HardhatDockerError;
class DockerHubConnectionError extends HardhatDockerError {
    constructor(parent) {
        super(parent);
        this.parent = parent;
        Object.setPrototypeOf(this, DockerHubConnectionError.prototype);
    }
}
exports.DockerHubConnectionError = DockerHubConnectionError;
class DockerNotInstalledError extends HardhatDockerError {
    constructor(parent) {
        super(parent);
        this.parent = parent;
        Object.setPrototypeOf(this, DockerNotInstalledError.prototype);
    }
}
exports.DockerNotInstalledError = DockerNotInstalledError;
class DockerNotRunningError extends HardhatDockerError {
    constructor(parent) {
        super(parent);
        this.parent = parent;
        Object.setPrototypeOf(this, DockerNotRunningError.prototype);
    }
}
exports.DockerNotRunningError = DockerNotRunningError;
class DockerBadGatewayError extends HardhatDockerError {
    constructor(parent) {
        super(parent);
        this.parent = parent;
        Object.setPrototypeOf(this, DockerBadGatewayError.prototype);
    }
}
exports.DockerBadGatewayError = DockerBadGatewayError;
class ImageDoesntExistError extends HardhatDockerError {
    constructor(image, parent) {
        super(parent);
        this.image = image;
        this.parent = parent;
        Object.setPrototypeOf(this, ImageDoesntExistError.prototype);
    }
}
exports.ImageDoesntExistError = ImageDoesntExistError;
class BindDoesntExistInHostError extends HardhatDockerError {
    constructor(path) {
        super();
        this.path = path;
        Object.setPrototypeOf(this, BindDoesntExistInHostError.prototype);
    }
}
exports.BindDoesntExistInHostError = BindDoesntExistInHostError;
class DockerServerError extends HardhatDockerError {
    constructor(parent) {
        super(parent);
        this.parent = parent;
        Object.setPrototypeOf(this, DockerServerError.prototype);
    }
    getServerErrorMessage() {
        if (this.parent !== undefined) {
            const parentAsAny = this.parent;
            if (parentAsAny.json !== undefined) {
                return parentAsAny.json.message;
            }
            if (this.parent.message !== undefined) {
                return this.parent.message;
            }
        }
        return "Docker server error";
    }
}
exports.DockerServerError = DockerServerError;
class ExecutableNotFoundError extends HardhatDockerError {
    constructor(parent) {
        super(parent);
        this.parent = parent;
        Object.setPrototypeOf(this, ExecutableNotFoundError.prototype);
    }
}
exports.ExecutableNotFoundError = ExecutableNotFoundError;
//# sourceMappingURL=errors.js.map