import { Router } from 'worktop';
import { reply } from 'worktop/response';
import { listen } from 'worktop/cfw';

import { getModule } from './registry.js';

const API = new Router();

API.add('GET', '/pkg/*', async (_req, context) => {
    const pkgQuery = decodeURIComponent(context.params.wild);

    const headers = {
        'Content-Type': 'application/json',
        //'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
    };

    if (!pkgQuery) return reply(400, 'Missing package query', headers);

    let moduleTree = {};
    try {
        const [entryModule, graph] = await walkModuleGraph(pkgQuery);
        moduleTree = formTreeFromGraph(graph.modules.get(entryModule.key), graph);
    } catch (e) {
        return reply(404, JSON.stringify({ error: e.message }), headers);
    }

    return reply(200, JSON.stringify(moduleTree), headers);
});

listen(API.run);

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
    const graph = {
        modules: new Map(),
    };

    /**
     * @param {Module} module
     * @param {number} [level=0]
     */
    const walk = async (module, level = 0) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        if (Array.isArray(module)) {
            return Promise.all(module.map((m) => walk(m, level)));
        }

        if (graph.modules.has(module.key)) {
            return Promise.resolve();
        }

        let deps = [];
        for (const [name, version] of Object.entries(module.pkg.dependencies || {})) {
            deps.push({ name, version });
        }

        /** @type {ModuleInfo} */
        const info = {
            module,
            level,
            poisoned: JSON.stringify(module.pkg).includes('ljharb'),
        };
        graph.modules.set(module.key, info);

        return Promise.all(
            deps.map(async (dep) => {
                const module = await getModule(dep.name, dep.version);
                await walk(module, level + 1);

                return module;
            }),
        ).then((deps) => (info.dependencies = deps));
    };

    const module = await getModule(query);
    if (module) await walk(module);
    return [module, graph];
}

/**
 * @param {ModuleInfo} entryModule
 * @param {Graph} graph
 */
function formTreeFromGraph(entryModule, graph) {
    let moduleTree = {};

    /**
     * @param {ModuleInfo} module
     * @param {{ dependencies: unknown[] }} [parent]
     */
    const _walk = (module, parent) => {
        const m = {
            name: module.module.pkg.name,
            poisoned: module.poisoned,
            ...(module.dependencies.length && { dependencies: [] }),
        };

        if (module.dependencies.length) {
            for (const dep of module.dependencies) {
                _walk(graph.modules.get(dep.key), m);
            }
        }

        parent ? parent.dependencies.push(m) : (moduleTree = m);
    };

    if (entryModule) _walk(entryModule);
    return moduleTree;
}
