import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-wmr';

import { getPackageData } from './pkg/pkgQuery.js';

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

    const fetchPkgTree = useCallback(async (pkgQuery) => {
        setServerRes(null);
        setInProgress(true);
        try {
            const res = await getPackageData(pkgQuery);

            setServerRes(res);
            setInProgress(false);
            window.history.pushState({}, '', `?q=${pkgQuery}`);
        } catch (e) {
            setServerRes({ error: e.message });
            setInProgress(false);
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
            <Main widthStyle="flex justify-center w-full lg:max-w-screen-lg">
                <div class="h-fit w-full 2xl:mt-[5vh] p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
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
    const container = useRef(null);
    let mouseDown = false;
    let startX, scrollLeft;

    useEffect(() => {
        if (container.current && !serverRes.error) {
            if (container.current.scrollWidth > container.current.clientWidth) {
                container.current.classList.add('cursor-grab');
            }
        }
    }, [container]);

    const startDragging = (e) => {
        e.preventDefault();
        mouseDown = true;
        startX = e.pageX - container.current.offsetLeft;
        scrollLeft = container.current.scrollLeft;
        container.current.style.cursor = 'grabbing';
    };

    const stopDragging = () => {
        mouseDown = false;
        container.current.style.removeProperty('cursor');
    };

    const move = (e) => {
        e.preventDefault();
        if (!mouseDown) return;
        const scroll = e.pageX - container.current.offsetLeft - startX;
        container.current.scrollLeft = scrollLeft - scroll;
    };

    return (
        <>
            <section
                ref={container}
                class={`mt-8 p-4 overflow-x-auto border(& ${
                    serverRes.error ? 'red' : 'primary-dim'
                } 1) rounded`}
                onMouseMove={move}
                onMouseDown={startDragging}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
            >
                {serverRes.error ? serverRes.error : <PackageTree pkg={serverRes} />}
            </section>
            {!serverRes.error && (
                <>
                    <p class="mt-4">
                        Any packages underlined in red above have You-Know-Who as a maintainer
                    </p>
                    <p class="mt-2">
                        Any packages with an amber background above are recurisve and therefore
                        their dependencies are skipped from tree display
                    </p>
                </>
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
                        pkg.poisoned ? 'underline decoration-red' : ''
                    } ${pkg.recursive ? '!bg-[#451a03]' : ''}`}
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
