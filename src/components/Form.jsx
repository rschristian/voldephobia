import { useEffect, useRef } from 'preact/hooks';

/**
 * @param {string} readerResult
 * @returns {string | { error: string }}
 */
function extractPackageData(readerResult) {
    try {
        const { dependencies, devDependencies, peerDependencies } = JSON.parse(readerResult);
        if (!dependencies && !devDependencies && !peerDependencies) {
            return { error: 'No dependencies found in uploaded file' };
        }

        return Array.from(
            Object.entries({
                ...dependencies,
                ...devDependencies,
                ...peerDependencies,
            }).map(([key, value]) => `${key}@${value}`),
        ).join(',');
    } catch (e) {
        return { error: 'Are you sure you uploaded JSON?' };
    }
}

export function PackageForm({ setQueryResult, fetchPkgTree }) {
    const formRef = useRef(null);

    useEffect(() => {
        if (formRef.current) {
            const defaultValue = (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('q')) || '';
            formRef.current[0].defaultValue = defaultValue;
        }
    }, []);

    const onFileSubmit = async (e) => {
        e.preventDefault();
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = () => {
            const deps = extractPackageData(/** @type {string} */ (reader.result));
            if (typeof deps !== 'string') return setQueryResult({ error: deps.error });
            formRef.current[0].value = deps;
            formRef.current.requestSubmit();
        };
        reader.onerror = () =>
            setQueryResult({ error: `Error when attempting to read file: ${file.name}` });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        const pkgQuery = new FormData(formRef.current).get('pkgQuery');
        if (pkgQuery) fetchPkgTree(pkgQuery);
    };

    return (
        <form ref={formRef} onSubmit={onSubmit}>
            <div class="flex(& col md:row) my-8 items-center">
                <input
                    name="pkgQuery"
                    autocorrect="off"
                    autocapitalize="none"
                    enterkeyhint="search"
                    class="py-2 px-4 w-full text(xl md:3xl center [#111]) bg-input(& dark:dark) drop-shadow-lg rounded-lg"
                    placeholder="Provide a package name"
                />
                <span class="mx-4 my(4 md:0)">Or...</span>
                <input
                    id="file-upload"
                    onChange={onFileSubmit}
                    type="file"
                    accept="application/json"
                />
                <label
                    for="file-upload"
                    class="py-2 px-4 bg-highlight(& dark:dark) drop-shadow-lg rounded-lg"
                >
                    Upload package.json
                </label>
            </div>
        </form>
    );
}
