import { getModuleData } from './registry.js';

const HE_WHO_MUST_NOT_BE_NAMED = String.fromCharCode(108, 106, 104, 97, 114, 98);

/**
 * @param {string} message
 */
function errorResponse(message) {
    // Normalize error messages, as NPM isn't consistent with its responses
    if (!message.startsWith('Error: ')) message = `Error: ${message}`;
    throw new Error(message);
}

export async function getPackageData(pkgQuery) {
    const pkgQueries = pkgQuery.toLowerCase().split(',');

    const moduleTrees = [];
    let uniqueModules = new Set();
    let poisonedModules = new Set();
    const stats = {
        moduleCount: 0,
        poisonedModuleCount: 0,
        nodeCount: 0,
    };

    const buildModuleTree = async (iter) => {
        for (const query of iter) {
            try {
                if (!query) errorResponse('Missing package query');
                if (!/^(?:@.+\/[a-z]|[a-z])/.test(query))
                    errorResponse(
                        'Invalid package query, see: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name',
                    );
                const {
                    moduleTree,
                    moduleCache,
                    poisonedModules: pModules,
                } = await walkModuleGraph(query);

                moduleTrees.push(moduleTree);
                stats.nodeCount += moduleTree.nodeCount;

                uniqueModules = new Set([...uniqueModules, ...moduleCache.keys()]);
                poisonedModules = new Set([...poisonedModules, ...pModules]);
            } catch (e) {
                errorResponse(e.message);
            }
        }
    };

    await Promise.all(Array(5).fill(pkgQueries.values()).map(buildModuleTree));
    moduleTrees.sort((a, b) => a.name.localeCompare(b.name));

    stats.moduleCount = uniqueModules.size;
    stats.poisonedModuleCount = poisonedModules.size;
    return { moduleTrees, stats };
}

/**
 * @typedef {import('./types.d.ts').Module} Module
 * @typedef {import('./types.d.ts').ModuleTree} ModuleTree
 * @typedef {import('./types.d.ts').ModuleTreeCache} ModuleTreeCache
 * @typedef {import('./types.d.ts').ModuleGraph} ModuleGraph
 */

/**
 * @param {string} query
 * @returns {Promise<ModuleGraph>}
 */
async function walkModuleGraph(query) {
    /** @type {ModuleTreeCache} */
    const moduleCache = new Map();

    const poisonedModules = new Set();

    // Used to prevent circular deps
    const parentNodes = new Set();

    /**
     * @param {Module} module
     * @returns {Promise<ModuleTree>}
     */
    const _walk = async (module) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        let deps = [];
        for (const [name, version] of Object.entries(module.pkg.dependencies || {})) {
            deps.push({ name, version });
        }

        const shouldWalk = !parentNodes.has(module.pkg.name);

        const info = {
            name: module.pkg.name,
            version: module.pkg.version,
            nodeCount: 1,
            poisoned: module.maintainers.some((m) => m.name === HE_WHO_MUST_NOT_BE_NAMED),
            ...(shouldWalk && deps.length && { dependencies: [] }),
        };
        if (info.poisoned) poisonedModules.add(info.name);

        if (shouldWalk) {
            parentNodes.add(info.name);
            // Trying to be a respectful user; increasing this speeds
            // up the process considerably but we might already be
            // encroaching on the rate limits.
            await Promise.all(
                Array(2)
                    .fill(deps.values())
                    .map(async (deps) => {
                        for (const dep of deps) {
                            const module = await getModuleData(dep.name, dep.version);
                            const moduleTree = await _walk(module);
                            info.nodeCount += moduleTree.nodeCount;
                            info.dependencies.push(moduleTree);
                        }
                    }),
            );
            info.dependencies?.sort((a, b) => a.name.localeCompare(b.name));
            parentNodes.delete(info.name);
        }
        moduleCache.set(module.key, info);

        return info;
    };

    const module = await getModuleData(query);
    const moduleTree = await _walk(module);
    return { moduleTree, moduleCache, poisonedModules };
}
