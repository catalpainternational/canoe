export default class Logger {
    #name: string;

    constructor(name: string) {
        this.#name = name;
    }

    log(...params: any[]): void {
        // eslint-disable-next-line no-console
        console.log(...alterParams(this.#name, ...params));
    }

    info(...params: any[]): void {
        // eslint-disable-next-line no-console
        console.info(...alterParams(this.#name, ...params));
    }

    warn(...params: any[]): void {
        // eslint-disable-next-line no-console
        console.warn(...alterParams(this.#name, ...params));
    }

    error(...params: any[]): void {
        // eslint-disable-next-line no-console
        console.error(...alterParams(this.#name, ...params));
    }
    group(label: string): void {
        // eslint-disable-next-line no-console
        console.group(`${this.#name}: ${label}`);
    }
    groupEnd(): void {
        // eslint-disable-next-line no-console
        console.groupEnd();
    }
}

function alterParams(loggerName: string, ...params: any[]): any[] {
    return [`${loggerName}: ${params[0]}`, ...params.slice(1)];
}
