const NPM_REGISTRY = 'https://registry.npmjs.org';
const moduleCache = new Map();

/**
 * @typedef {object} Module
 * @property {string} name
 * @property {string} version
 * @property {Record<string, string>} dependencies
 * @property {{ name: string, email: string }[]} maintainers
 */

/**
 * @typedef {object} ModuleCacheEntry
 * @property {Promise<Module>} resolve
 * @property {Module} module
 */

/**
 * @param {string} query
 */
function getModuleNameAndVersionFromQuery(query) {
    let name = query;
    let version;

    const versionedNameParts = query.match(/(.+)@(.+)/);
    if (versionedNameParts) {
        name = versionedNameParts[1];
        version = versionedNameParts[2];
    }

    return { name, version };
}

/**
 * @param {string} name
 * @param {string} version
 */
function normalizeModuleInfo(name, version) {
    // Handle cases such as 'npm:@preact/compat'
    if (version?.startsWith('npm:')) {
        name = version.slice(4);
        version = undefined;
    }

    if (!version) {
        ({ name, version } = getModuleNameAndVersionFromQuery(name));
    }

    if (!version) {
        version = 'latest';
    }

    return { name, version };
}

function createModuleKey(name, version) {
    return version ? `${name}@${version}` : name;
}

/**
 * @param {string} name
 * @param {string} version
 */
async function getModule(name, version) {
    ({ name, version } = normalizeModuleInfo(name, version));

    const cacheKey = createModuleKey(name, version);

    const cachedModule = moduleCache.get(cacheKey);
    if (cachedModule) {
        return cachedModule.resolve;
    }

    /** @type {ModuleCacheEntry} */
    const cacheModule = {};
    moduleCache.set(cacheKey, cacheModule);

    cacheModule.resolve = (async () => {
        let pkg;
        try {
            console.log(`${NPM_REGISTRY}/${name}/${version}`);
            const res = await fetch(`${NPM_REGISTRY}/${name}/${version}`);
            pkg = await res.json();
        } catch (e) {
            console.log(e)
        }

        cacheModule.module = pkg;

        moduleCache.set(cacheKey, cacheModule);

        return cacheModule.module;
    })();

    return cacheModule.resolve;
}

export async function getModuleGraph(query) {
    const entryModule = getModuleNameAndVersionFromQuery(query);

    const graph = {
        modules: new Map(),
    };

    const walk = async (module, level = 0) => {
        if (!module) return Promise.reject(new Error('Module not found'));

        if (Array.isArray(module)) {
            return Promise.all(module.map(m => walk(m, level)));
        }

        if (graph.modules.has(module.name)) {
            return Promise.resolve();
        }

        let deps = [];
        for (const [name, version] of Object.entries(module.dependencies)) {
            deps.push({ name, version });
        }

        return Promise.all(
            deps.map(async ({ name, version }) => {
                try {
                    const module = await getModule(name, version);
                    await walk(module);
                } catch (e) {
                    console.log(e);
                }

                return { module };
            })
        )
    }

    return Promise.allSettled(
        [entryModule].map(async ({ name, version }) => {
            const module = await getModule(name, version);
            return module && walk(module);
        })
    ).then(() => graph);
}
