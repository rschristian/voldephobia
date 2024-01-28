import { getModule } from './registry.js';

/**
 * @param {string} message
 */
function errorResponse(message) {
    // Normalize error messages, as NPM isn't consistent with its responses
    if (!message.startsWith('Error: ')) message = `Error: ${message}`;
    throw new Error(message);
}

export async function getPackageData(pkgQuery) {
    pkgQuery = pkgQuery.toLowerCase();

    if (!pkgQuery) errorResponse('Missing package query');
    if (!/^(?:@.+\/[a-z]|[a-z])/.test(pkgQuery))
        errorResponse(
            'Invalid package query, see: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#name',
        );

    let moduleTree = {};
    const stats = {
        moduleCount: 0,
        poisonedModuleCount: 0,
        nodeCount: 0,
    }
    try {
        const [entryModule, graph] = await walkModuleGraph(pkgQuery);
        ([moduleTree, stats.nodeCount] = formTreeFromGraph(graph.get(entryModule.key), graph));

        stats.moduleCount = graph.size;
        graph.forEach((m) => (m.poisoned && stats.poisonedModuleCount++));
    } catch (e) {
        errorResponse(e.message);
    }

    return { moduleTree, stats };
}

/**
 * @typedef {import('./types.d.ts').Module} Module
 * @typedef {import('./types.d.ts').ModuleInfo} ModuleInfo
 * @typedef {import('./types.d.ts').Graph} Graph
 */

/**
 * @param {string} query
 * @returns {Promise<[Module, Graph]>}
 */
async function walkModuleGraph(query) {
    /** @type {Graph} */
    const graph = new Map();

    /**
     * @param {Module} module
     * @param {number} [level=0]
     */
    const _walk = async (module, level = 0) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        if (graph.has(module.key)) return;

        let deps = [];
        for (const [name, version] of Object.entries(module.pkg.dependencies || {})) {
            deps.push({ name, version });
        }

        const { dependencies, devDependencies, peerDependencies, ...pkgWithoutDeps } = module.pkg;

        /** @type {ModuleInfo} */
        const info = {
            module,
            level,
            poisoned: JSON.stringify(pkgWithoutDeps).includes('ljharb'),
            dependencies: [],
        };
        graph.set(module.key, info);

        const resolvedDeps = await Promise.all(
            deps.map(async (dep) => {
                const module = await getModule(dep.name, dep.version);
                await _walk(module, level + 1);

                return module;
            }),
        );

        info.dependencies = resolvedDeps;
    };

    const module = await getModule(query);
    await _walk(module);
    return [module, graph];
}

/**
 * @param {ModuleInfo} entryModule
 * @param {Graph} graph
 * @returns {[Object, number]}
 */
function formTreeFromGraph(entryModule, graph) {
    let moduleTree = {};
    const parentNodes = new Set();
    let nodeCount = 0;

    /**
     * @param {ModuleInfo} module
     * @param {{ dependencies: unknown[] }} [parent]
     */
    const _walk = (module, parent) => {
        const shouldWalk = !parentNodes.has(module.module.pkg.name);

        const m = {
            name: module.module.pkg.name,
            version: module.module.pkg.version,
            poisoned: module.poisoned,
            ...(shouldWalk && module.dependencies.length && { dependencies: [] }),
        };

        if (shouldWalk) {
            parentNodes.add(m.name);
            for (const dep of module.dependencies) {
                _walk(graph.get(dep.key), m);
            }
            parentNodes.delete(m.name);
        }

        parent ? parent.dependencies.push(m) : (moduleTree = m);
        nodeCount++;
    };

    if (entryModule) _walk(entryModule);
    return [moduleTree, nodeCount];
}
