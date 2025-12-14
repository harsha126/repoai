const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const CURRENT_LOG_LEVEL =
    LOG_LEVELS[(process.env.LOG_LEVEL as keyof typeof LOG_LEVELS) || "info"];
const MAX_LOG_LENGTH = parseInt(process.env.MAX_LOG_LENGTH || "2000", 10);

const shouldLog = (level: keyof typeof LOG_LEVELS) => {
    return LOG_LEVELS[level] >= CURRENT_LOG_LEVEL;
};

const truncate = (message: string) => {
    if (message.length > MAX_LOG_LENGTH) {
        return message.substring(0, MAX_LOG_LENGTH) + "...[TRUNCATED]";
    }
    return message;
};

export const logger = {
    debug: (message: string, meta?: Record<string, any>) => {
        if (!shouldLog("debug")) return;
        console.debug(
            JSON.stringify({
                level: "debug",
                timestamp: new Date().toISOString(),
                message: truncate(message),
                ...meta,
            })
        );
    },
    info: (message: string, meta?: Record<string, any>) => {
        if (!shouldLog("info")) return;
        console.log(
            JSON.stringify({
                level: "info",
                timestamp: new Date().toISOString(),
                message: truncate(message),
                ...meta,
            })
        );
    },
    error: (message: string, error?: any, meta?: Record<string, any>) => {
        if (!shouldLog("error")) return;
        console.error(
            JSON.stringify({
                level: "error",
                timestamp: new Date().toISOString(),
                message: truncate(message),
                error: error?.message || error,
                stack: error?.stack,
                ...meta,
            })
        );
    },
    warn: (message: string, meta?: Record<string, any>) => {
        if (!shouldLog("warn")) return;
        console.warn(
            JSON.stringify({
                level: "warn",
                timestamp: new Date().toISOString(),
                message: truncate(message),
                ...meta,
            })
        );
    },
};
