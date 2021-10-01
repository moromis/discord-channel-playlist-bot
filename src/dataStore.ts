import * as fs from "fs";
import * as path from "path";
import * as config from "../config.json";
import { DataStoreShape } from "./types/dataStore";

type Mutator<T> = (value: T | undefined) => T;

export interface DataStore {
  set<T>(key: string, value: T): void;
  mutate<T>(key: string, mutator: Mutator<T>);
  get<T>(key: string): T;
  has(key: string): boolean;
  remove(key: string): void;
}

export class LocalDataStore implements DataStore {
  constructor(private path: string) {}

  public set<T>(key: string, value: T): void {
    const store = this.loadStore();

    store[key] = value;

    this.saveStore(store);
  }

  public mutate<T>(key: string, mutator: Mutator<T>): void {
    const store = this.loadStore();

    store[key] = mutator(store[key]);

    this.saveStore(store);
  }

  public get<T>(key: string): T {
    const store = this.loadStore();

    return store[key];
  }

  public has(key: string): boolean {
    const store = this.loadStore();

    return Object.getOwnPropertyNames(store).some(
      (propName) => key === propName
    );
  }

  public remove(key: string): void {
    const store = this.loadStore();

    delete store[key];

    this.saveStore(store);
  }

  private loadStore(): DataStoreShape {
    if (fs.existsSync(this.path)) {
      return JSON.parse(fs.readFileSync(this.path, { encoding: "utf-8" }));
    } else {
      return {} as DataStoreShape;
    }
  }

  private saveStore(store: Partial<DataStoreShape>): void {
    const mkdirp = (fpath: string): void => {
      const dirname = path.dirname(fpath);

      if (fs.existsSync(dirname)) {
        return;
      } else {
        mkdirp(dirname), fs.mkdirSync(dirname);
      }
    };

    mkdirp(this.path);
    fs.writeFileSync(this.path, JSON.stringify(store, null, 2), {
      encoding: "utf-8",
    });
  }
}

export const store: DataStore = new LocalDataStore(config.dataStoreLocation);
