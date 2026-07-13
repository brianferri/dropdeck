import { SourceError } from "@dropdeck/common";

export class MathError extends SourceError {
    public constructor(message: string, offset: number) {
        super(message, offset);
        this.name = "MathError";
    }
}
