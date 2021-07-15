export interface ICache {
  getValue(name: string, type: string, date: string): Promise<any>
  setValue(name: string, type: string, date: string, value: string | number): Promise<void>
}
