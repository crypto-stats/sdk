import { Context } from './Context';

export interface ICache {
  getValue(name: string, type: string, date: string): Promise<any>
  setValue(name: string, type: string, date: string, value: string | number): Promise<void>
}

export type SetupFn = (context: Context) => void;
