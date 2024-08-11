import { useEffect, useRef } from 'preact/hooks';
import Hint from 'preact-hint';

import { PackageTree } from './PackageTree.jsx';

export function DataBox({ queryResult }) {
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
                <div class="overflow-x-auto p-0.5">
                    {queryResult.error
                        ? <p class="whitespace-pre">{queryResult.error}</p>
                        : <div
                            ref={container}
                            onMouseMove={move}
                            onMouseDown={startDragging}
                            onMouseUp={stopDragging}
                            onMouseLeave={stopDragging}
                        >
                            {queryResult.moduleTrees.map(pkg => <PackageTree pkg={pkg} />)}
                        </div>
                    }
                </div>
            </section>
            {!queryResult.error && (
                <p class="mt-4">
                    Any packages <span class="underline(& offset-4) decoration(2 red)">underlined in red</span>{' '}
                    above have You-Know-Who as a maintainer
                </p>
            )}
        </>
    );
}
