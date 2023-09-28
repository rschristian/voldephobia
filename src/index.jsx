import { Root, Main, Header, Footer } from '@rschristian/intrepid-design';
import { withTwind } from '@rschristian/twind-wmr';

export function App() {
    const submit = async (e) => {
        if (e.keyCode !== 13 || !e.target.value) return;
        const res = await fetch(`http://localhost:5000/pkg/${e.target.value}`, {
            method: 'GET',
        });

        console.log(await res.text());
    }

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
                <div>
                    <div class="text-center bg-[#111] p-8 rounded-xl mt-32">
                        <h1 class="text-4xl font-bold">Voldephobia</h1>
                        <p>Find out if your dependency tree is infected with packages from You-Know-Who</p>
                        <input
                            class="my-8 text(3xl center [#111]) drop-shadow-lg bg-[#eee] rounded-lg"
                            placeholder="Provide a package name"
                            onKeyDown={submit}
                        />
                        <p class="text-xs">This is mostly a joke, but the resistance to modernizing is worrying</p>
                    </div>
                </div>
            </Main>
            <Footer year={2023} />
        </Root>
    );
}

const { hydrate, prerender } = withTwind(
    () => import('./styles/twind.config.js'),
    () => <App />,
);

hydrate(<App />);

export { prerender };
