import * as semver from 'semver';

const NPM_REGISTRY = 'https://registry.npmjs.org';
const moduleCache = new Map();

/**
 * @typedef {import('./types.d.ts').Module} Module
 * @typedef {import('./types.d.ts').PackageData} PackageData
 * @typedef {import('./types.d.ts').ModuleCacheEntry} ModuleCacheEntry
 * @typedef {import('./types.d.ts').PackageMetaData} PackageMetaData
 */

/**
 * @param {string} name
 * @param {string} [version]
 */
function normalizeModuleInfo(name, version) {
    // Handle cases such as 'npm:@preact/compat'
    if (version?.startsWith('npm:')) {
        name = version.slice(4);
        version = undefined;
    }

    if (!version) {
        const versionedNameParts = name.match(/(.+)@(.+)/);
        if (versionedNameParts) {
            name = versionedNameParts[1];
            version = versionedNameParts[2];
        }
    }

    return { name, version };
}

/**
 * @param {string} name
 * @param {string} [version]
 */
function createModuleKey(name, version) {
    return version ? `${name}@${version}` : name;
}

/**
 * @param {PackageMetaData} pkg
 * @param {string}[targetVersion='latest']
 */
function getSatisfyingSemverVersion(pkg, targetVersion = 'latest') {
    const distVersion = pkg['dist-tags']?.[targetVersion];
    if (distVersion) return distVersion;

    // Newer versions are probably more highly used, so start from the end (newest)
    for (const version of Object.keys(pkg.versions).reverse()) {
        if (semver.satisfies(version, targetVersion)) return version;
    }
}

/**
 * @param {string} name
 * @param {string} [version]
 * @returns {Promise<Module>}
 */
export async function getModule(name, version) {
    ({ name, version } = normalizeModuleInfo(name, version));

    const cacheKey = createModuleKey(name, version);

    const cachedModule = moduleCache.get(cacheKey);
    if (cachedModule) return cachedModule.resolve;

    /** @type {ModuleCacheEntry} */
    const cacheEntry = {};
    moduleCache.set(cacheKey, cacheEntry);

    cacheEntry.resolve = (async () => {
        /** @type {PackageData} */
        let pkg;
        try {
            /** @type {PackageMetaData} */
            const pkgMeta = await (await fetch(`${NPM_REGISTRY}/${name}`)).json();

            // NPM, for some reason, returns a string rather than an
            // object w/ an `error` property here. Yay for consistent APIs!
            if (typeof pkg === 'string') throw new Error(pkg);

            version = getSatisfyingSemverVersion(pkgMeta, version);
            pkg = pkgMeta.versions[version];
        } catch (e) {
            throw new Error(e);
        }

        cacheEntry.module = {
            key: createModuleKey(name, version),
            pkg,
        };

        moduleCache.set(cacheEntry.module.key, cacheEntry);

        return cacheEntry.module;
    })();

    return cacheEntry.resolve;
}
