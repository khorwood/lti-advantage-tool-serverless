'use strict';

class ArgumentNullError extends Error {
    constructor(argumentName) {
        super(`Missing argument: ${argumentName}`);

        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.statusCode = 400;
        this.body = this.message;
    }
}

module.exports = {
    ArgumentNullError
};
