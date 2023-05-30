import { Scenario } from './index.js';
export interface ListParams {
    files: string[];
    require: string[] | undefined;
    matrix: string | undefined;
}
export declare function list(params: ListParams): Promise<Scenario[]>;
export declare function printList(params: ListParams): Promise<void>;
