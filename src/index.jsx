import { useCallback, useEffect, useState } from 'preact/hooks';
import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-wmr';

const API_URL = import.meta.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '';

export function App() {
    const [pkgQuery, setPkgQuery] = useState('');
    const [serverRes, setServerRes] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    // Fetch package data if `?q=package-name` has been provided
    useEffect(() => {
        const queryParamPkg = new URLSearchParams(window.location.search).get('q');
        if (queryParamPkg) {
            fetchPkgTree(queryParamPkg);
            setPkgQuery(queryParamPkg);
        }
    }, []);

    const fetchPkgTree = useCallback(async (name) => {
        setServerRes(null);
        setInProgress(true);
        try {
            const res = await (
                await fetch(`${API_URL}/pkg/${encodeURIComponent(name)}`, {
                    method: 'GET',
                })
            ).json();

            setServerRes(res);
            setInProgress(false);
            window.history.pushState({}, '', `?q=${name}`);
        } catch (e) {
            console.log(e);
        }
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (pkgQuery) fetchPkgTree(pkgQuery);
    };

    return (
        <Root>
            <Header>
                <Header.NavItem
                    href="https://github.com/rschristian/voldephobia"
                    label="GitHub Source"
                    iconId="github"
                />
                <Header.ThemeToggle />
            </Header>
            <Main widthStyle="flex justify-center w-full lg:max-w-6xl">
                <div class="h-fit w-full lg:mt-32 p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
                    <h1 class="text-4xl font-bold">Voldephobia</h1>
                    <p class="p-2">
                        Find out if your dependency tree is plagued with packages from You-Know-Who
                    </p>
                    <form onSubmit={onSubmit}>
                        <input
                            autocorrect="off"
                            autocapitalize="none"
                            enterkeyhint="search"
                            class="my-8 py-2 px-4 w-full text(3xl center [#111]) bg-input(& dark:dark) drop-shadow-lg rounded-lg"
                            placeholder="Provide a package name"
                            value={pkgQuery}
                            onInput={(e) =>
                                setPkgQuery(/** @type {HTMLInputElement} */ (e.target).value)
                            }
                        />
                    </form>
                    <p class="text-xs">
                        This is mostly a joke, but the resistance to modernizing is disconcerting
                    </p>
                    {inProgress && <span class="loader mt-8 p-4"></span>}
                    {serverRes && <DataBox serverRes={serverRes} />}
                </div>
            </Main>
            <Footer year={2023} />
        </Root>
    );
}

function DataBox({ serverRes }) {
    return (
        <>
            <section
                class={`mt-8 p-4 overflow-x-auto border(& ${
                    serverRes.error ? 'red' : 'primary-dim'
                } 1) rounded`}
            >
                {serverRes.error ? serverRes.error : <PackageTree pkg={serverRes} />}
            </section>
            {!serverRes.error && (
                <p class="mt-4">
                    The packages underlined in red above have You-Know-Who as a maintainer
                </p>
            )}
        </>
    );
}

function PackageTree({ pkg, depth = 0, isLast = false, prefix = '' }) {
    let lineSymbol = prefix;
    let childPrefix = prefix;
    if (depth > 0) {
        lineSymbol += (isLast ? '└' : '├').padEnd(8, '-');
        childPrefix += (isLast ? ' ' : '│').padEnd(10, ' ');
    }

    return (
        <div class={depth == 1 && 'ml-4'}>
            <pre class="w-max">
                {lineSymbol}
                <a
                    class={`px-1 py-0.5 rounded bg-highlight(& dark:dark) hocus:opacity-80 ${
                        pkg.poisoned && 'underline decoration-red'
                    }`}
                    href={`https://npm.im/${pkg.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {`${pkg.name}@${pkg.version}`}
                </a>
            </pre>
            {pkg.dependencies?.length &&
                pkg.dependencies.map((dep, i) => (
                    <PackageTree
                        pkg={dep}
                        depth={depth + 1}
                        isLast={pkg.dependencies.length - 1 == i}
                        prefix={childPrefix}
                    />
                ))}
        </div>
    );
}

const { hydrate, prerender } = withTwind(
    () => import('./styles/twind.config.js'),
    () => <App />,
    true,
);

hydrate(<App />);

export { prerender };
