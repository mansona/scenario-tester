import { removeSync } from 'fs-extra';
import { list } from './list';
export async function output(params) {
    let scenarios = await list(params);
    for (let scenario of scenarios) {
        if (scenario.name.indexOf(params.scenario) !== -1) {
            process.stdout.write(`Found scenario ${scenario.name}\n`);
            removeSync(params.outdir);
            await scenario.prepare(params.outdir);
            process.stdout.write(`Wrote successfully to ${params.outdir}\n`);
            return;
        }
    }
    process.stderr.write(`No matching scenario ${params.scenario}. Try running "scenario-tester list" to see all available scenarios.`);
    process.exit(-1);
}
//# sourceMappingURL=output.js.map