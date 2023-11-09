// index
export interface Module {
    key: string;
    pkg: PackageData;
}

export interface ModuleInfo {
    module: Module;
    level: number;
    poisoned: boolean;
    dependencies?: Module[];
}

type Graph = Map<string, ModuleInfo>;

// registry
export interface PackageData {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    maintainers?: { name: string; email: string }[];
}

export interface ModuleCacheEntry {
    resolve: Promise<Module>;
    module: Module;
}

export interface AbbreviatedMetaData {
    'dist-tags'?: Record<string, string>;
    versions: Record<string, PackageData>;
    error?: string;
}
