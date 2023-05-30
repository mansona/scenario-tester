import { Project } from 'fixturify-project';
declare type ProjectMutator = (project: Project) => void | Promise<void>;
export { Project };
export declare class Scenarios {
    private state;
    static fromDir(appPath: string, as?: 'app' | 'lib'): Scenarios;
    static fromProject(fn: () => Promise<Project> | Project): Scenarios;
    expand(variants: Record<string, ProjectMutator>): Scenarios;
    skip(variantName: string): Scenarios;
    only(variantName: string): Scenarios;
    map(name: string, fn: ProjectMutator): Scenarios;
    private iterate;
    forEachScenario(fn: (appDefinition: Scenario) => void): void;
    private constructor();
}
export declare const seenScenarios: Scenario[];
export declare class Scenario {
    name: string;
    private getBaseScenario;
    private mutators;
    constructor(name: string, getBaseScenario: () => Project | Promise<Project>, mutators: ProjectMutator[]);
    prepare(outdir?: string): Promise<PreparedApp>;
}
export declare class PreparedApp {
    dir: string;
    constructor(dir: string);
    execute(shellCommand: string, opts?: {
        env?: Record<string, string>;
    }): Promise<{
        exitCode: number;
        stderr: string;
        stdout: string;
        output: string;
    }>;
}
