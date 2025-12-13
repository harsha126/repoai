export const logger = {
    info: (message: string, meta?: Record<string, any>) => {
        console.log(
            JSON.stringify({
                level: "info",
                timestamp: new Date().toISOString(),
                message,
                ...meta,
            })
        );
    },
    error: (message: string, error?: any, meta?: Record<string, any>) => {
        console.error(
            JSON.stringify({
                level: "error",
                timestamp: new Date().toISOString(),
                message,
                error: error?.message || error,
                stack: error?.stack,
                ...meta,
            })
        );
    },
    warn: (message: string, meta?: Record<string, any>) => {
        console.warn(
            JSON.stringify({
                level: "warn",
                timestamp: new Date().toISOString(),
                message,
                ...meta,
            })
        );
    },
};
