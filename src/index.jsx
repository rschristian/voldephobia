import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-preact-iso';
import Hint from 'preact-hint';

import { getPackageData } from './pkg/pkgQuery.js';
import {PackageForm} from './components/Form.jsx';

export function App() {
    const [queryResult, setQueryResult] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    // Fetch package data if `?q=package-name` has been provided
    useEffect(() => {
        const queryParamPkg = new URLSearchParams(window.location.search).get('q');
        if (queryParamPkg) fetchPkgTree(queryParamPkg);
    }, []);

    const fetchPkgTree = useCallback(async (pkgQuery) => {
        setQueryResult(null);
        setInProgress(true);
        try {
            const result = await getPackageData(pkgQuery);

            setQueryResult(result);
            window.history.pushState({}, '', `?q=${pkgQuery}`);
        } catch (e) {
            setQueryResult({ error: e.message });
        }
        setInProgress(false);
    }, []);

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
                <div class="h-fit w-full md:w-10/12 2xl:mt-[5vh] p(4 md:8) text-center bg-card(& dark:dark) rounded-xl">
                    <h1 class="text-4xl font-bold">Voldephobia</h1>
                    <p class="p-2">
                        Find out if your dependency tree is plagued with packages from You-Know-Who
                    </p>
                    <PackageForm setQueryResult={setQueryResult} fetchPkgTree={fetchPkgTree} />
                    <p class="text-xs">
                        This is mostly a joke, but the resistance to modernizing is disconcerting
                    </p>
                    {inProgress && <span class="loader mt-8 p-4"></span>}
                    {queryResult && <DataBox queryResult={queryResult} />}
                </div>
            </Main>
            <Footer year={2023} />
        </Root>
    );
}

function DataBox({ queryResult }) {
    const container = useRef(null);
    let mouseDown = false;
    let startX, scrollLeft;

    useEffect(() => {
        if (container.current && !queryResult.error) {
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
            <section class={`relative mt-8 p-4 border(& ${queryResult.error ? 'red' : 'primary-dim'} 1) rounded`}>
                {!queryResult.error && (
                    <Hint template={() => (
                        <div class="text-left">
                            Module Count: {queryResult.stats.moduleCount}<br />
                            Poisoned Module Count: {queryResult.stats.poisonedModuleCount}<br />
                            Total Number of Nodes: {queryResult.stats.nodeCount}
                        </div>
                    )}>
                        <svg data-hint=" " class="absolute right-0">
                            <use href="/assets/icons.svg#info" />
                        </svg>
                    </Hint>
                )}
                <div
                    ref={container}
                    class="overflow-x-auto p-0.5"
                    onMouseMove={move}
                    onMouseDown={startDragging}
                    onMouseUp={stopDragging}
                    onMouseLeave={stopDragging}
                >
                    {queryResult.error
                        ? queryResult.error
                        : queryResult.moduleTrees.map(pkg => <PackageTree pkg={pkg} />)
                    }
                </div>
            </section>
            {!queryResult.error && (
                <p class="mt-4">
                    Any packages <span class="underline decoration-red">underlined in red</span>{' '}
                    above have You-Know-Who as a maintainer
                </p>
            )}
        </>
    );
}


/**
 * @param {Object} props
 * @param {import('./pkg/types.d.ts').ModuleTree} props.pkg
 * @param {number} [props.depth=0]
 * @param {boolean} [props.isLast=false]
 * @param {string} [props.prefix='']
 */
function PackageTree({ pkg, depth = 0, isLast = false, prefix = '' }) {
    let lineSymbol = prefix;
    let childPrefix = prefix;
    if (depth > 0) {
        lineSymbol += (isLast ? '└' : '├').padEnd(6, '-');
        childPrefix += (isLast ? ' ' : '│').padEnd(8, ' ');
    }

    return (
        <div class={depth == 0 && 'mb-4 last:mb-2' || depth == 1 && 'ml-4'}>
            <pre class="w-max">
                {lineSymbol}
                <a
                    class={`px-1 py-0.5 rounded bg-highlight(& dark:dark) hocus:opacity-80 ${
                        pkg.poisoned ? 'underline decoration-red' : ''
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
