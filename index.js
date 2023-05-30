import { Project } from 'fixturify-project';
import { setGracefulCleanup } from 'tmp';
import { spawn } from 'child_process';
setGracefulCleanup();
export { Project };
export class Scenarios {
    constructor(state) {
        this.state = state;
    }
    static fromDir(appPath, as = 'app') {
        return new this({
            type: 'root',
            root: () => Project.fromDir(appPath, as === 'app' ? { linkDevDeps: true } : { linkDeps: true }),
        });
    }
    static fromProject(fn) {
        return new this({
            type: 'root',
            root: fn,
        });
    }
    expand(variants) {
        return new Scenarios({
            type: 'derived',
            parent: this,
            variants: Object.fromEntries(Object.entries(variants).map(([variantName, mutator]) => [variantName, [mutator]])),
        });
    }
    skip(variantName) {
        if (this.state.type === 'root') {
            throw new Error(`no variant named ${variantName} available to skip on root scenario`);
        }
        if (!this.state.variants[variantName]) {
            throw new Error(`no variant named ${variantName} available to skip. Found variants: ${Object.keys(this.state.variants).join(', ')}`);
        }
        let variants = Object.assign({}, this.state.variants);
        delete variants[variantName];
        return new Scenarios({
            type: 'derived',
            parent: this.state.parent,
            variants,
        });
    }
    only(variantName) {
        if (this.state.type === 'root') {
            throw new Error(`no variant named ${variantName} available to skip on root scenario`);
        }
        if (!this.state.variants[variantName]) {
            throw new Error(`no variant named ${variantName} available to select via "only". Found variants: ${Object.keys(this.state.variants).join(', ')}`);
        }
        let variants = { [variantName]: this.state.variants[variantName] };
        return new Scenarios({
            type: 'derived',
            parent: this.state.parent,
            variants,
        });
    }
    map(name, fn) {
        if (this.state.type === 'root') {
            return new Scenarios({
                type: 'derived',
                parent: this,
                variants: {
                    [name]: [fn],
                },
            });
        }
        else {
            return new Scenarios({
                type: 'derived',
                parent: this.state.parent,
                variants: Object.fromEntries(Object.entries(this.state.variants).map(([variantName, mutators]) => [
                    `${variantName}-${name}`,
                    [...mutators, fn],
                ])),
            });
        }
    }
    iterate(fn) {
        if (this.state.type === 'root') {
            fn({ name: undefined, root: this.state.root, mutators: [] });
        }
        else {
            let state = this.state;
            this.state.parent.iterate((parent) => {
                for (let [variantName, mutators] of Object.entries(state.variants)) {
                    let combinedName = parent.name ? `${parent.name}-${variantName}` : variantName;
                    fn({
                        name: combinedName,
                        root: parent.root,
                        mutators: [...parent.mutators, ...mutators],
                    });
                }
            });
        }
    }
    forEachScenario(fn) {
        this.iterate(({ name, root, mutators }) => {
            fn(new Scenario(name ?? '<root>', root, mutators));
        });
    }
}
export const seenScenarios = [];
export class Scenario {
    constructor(name, getBaseScenario, mutators) {
        this.name = name;
        this.getBaseScenario = getBaseScenario;
        this.mutators = mutators;
        seenScenarios.push(this);
    }
    async prepare(outdir) {
        let project = await this.getBaseScenario();
        for (let fn of this.mutators) {
            await fn(project);
        }
        if (outdir) {
            project.baseDir = outdir;
        }
        await project.write();
        return new PreparedApp(project.baseDir);
    }
}
export class PreparedApp {
    constructor(dir) {
        this.dir = dir;
    }
    async execute(shellCommand, opts) {
        let env;
        if (opts?.env) {
            env = { ...process.env, ...opts.env };
        }
        let child = spawn(shellCommand, {
            stdio: ['inherit', 'pipe', 'pipe'],
            cwd: this.dir,
            shell: true,
            env,
        });
        let stderrBuffer = [];
        let stdoutBuffer = [];
        let combinedBuffer = [];
        child.stderr.on('data', (data) => {
            stderrBuffer.push(data);
            combinedBuffer.push(data);
        });
        child.stdout.on('data', (data) => {
            stdoutBuffer.push(data);
            combinedBuffer.push(data);
        });
        return new Promise((resolve) => {
            child.on('close', (exitCode) => {
                resolve({
                    exitCode,
                    get stdout() {
                        return stdoutBuffer.join('');
                    },
                    get stderr() {
                        return stderrBuffer.join('');
                    },
                    get output() {
                        return combinedBuffer.join('');
                    },
                });
            });
        });
    }
}
//# sourceMappingURL=index.js.map