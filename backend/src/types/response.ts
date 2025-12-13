export interface ApiResponse<T> {
    message: string;
    data: T;
}

export interface JobDTO {
    jobId: string;
    status: string;
    error?: string;
    repoId: string;
    repoUrl: string;
    owner: string;
}
