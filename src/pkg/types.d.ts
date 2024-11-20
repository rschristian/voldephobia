// index
export interface Module {
    key: string;
    pkg: PackageData;
    maintainers: Maintainers[];
}

export type ModuleTreeCache = Map<string, ModuleTree>;

export interface ModuleTree {
    name: string;
    version: string;
    nodeCount: number;
    poisoned: boolean;
    dependencies?: ModuleTree[];
}

export interface ModuleGraph {
    moduleTree: ModuleTree;
    moduleCache: ModuleTreeCache;
    poisonedModules: Set<string>;
}

// registry
export interface PackageData {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    maintainers?: { name: string; email: string }[];
}

export interface Maintainers {
    name: string;
    email: string;
}

export interface ModuleCacheEntry {
    resolve: Promise<Module>;
    module: Module;
}

export interface PackageMetaData {
    'dist-tags'?: Record<string, string>;
    versions: Record<string, PackageData>;
    maintainers: Maintainers[];
    error?: string;
}
