<h1 align="center">Voldephobia</h1>

<p align="center">A silly little tool to find out if your dependency tree is plagued with packages from You-Know-Who</p>

---

<p align="center">
    <strong>Basic Usage</strong> ✯
    <a href="#api">API</a>
</p>

---

## Basic Usage

Navigate to <a href="https://voldephobia.rschristian.dev">voldephobia.rschristian.dev</a>, input a package query (can be a bare package name or name@version), and view the resulting data tree. With this, you can see which modules are poisoned and why they're included.

## API

In the off chance you'd like to interact with the data yourself, using it for another application, the API is deployed as a Cloudflare Worker and is available at <a href="https://voldephobia.rschristian.dev/pkg/">voldephobia.rschristian.dev/pkg/\*</a>. Simply provide the package query (pkgName or pkgName@version), URL encoded, and the API will do the rest.

Here's an example of the response data structure:

```json
{
    "name": "get-intrinsic",
    "version": "1.2.2",
    "poisoned": true,
    "dependencies": [
        {
            "name": "function-bind",
            "version": "1.1.2",
            "poisoned": true
        },
        {
            "name": "has-proto",
            "version": "1.0.1",
            "poisoned": true
        },
        {
            "name": "has-symbols",
            "version": "1.0.3",
            "poisoned": true
        },
        {
            "name": "hasown",
            "version": "2.0.0",
            "poisoned": true,
            "dependencies": [
                {
                    "name": "function-bind",
                    "version": "1.1.2",
                    "poisoned": true
                }
            ]
        }
    ]
}
```

## Acknowledgements

Much of the registry/module graph code was adopted from [`npmgraph`](https://github.com/npmgraph/npmgraph), the license of which can be found [here](https://github.com/npmgraph/npmgraph/blob/main/LICENSE).

## License

[MIT](https://github.com/rschristian/voldephobia/blob/master/LICENSE)
