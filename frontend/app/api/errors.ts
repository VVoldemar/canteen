export interface ApiError {
    code: string;
    message: string;
}

export class ApiException extends Error {
    constructor(public status: number, public error: ApiError) {
        super(`API Error ${status}: ${error.code} - ${error.message}`);
        this.name
    }
}