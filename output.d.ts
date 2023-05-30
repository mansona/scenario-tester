import { ListParams } from './list';
export interface OutputParams extends ListParams {
    scenario: string;
    outdir: string;
}
export declare function output(params: OutputParams): Promise<void>;
