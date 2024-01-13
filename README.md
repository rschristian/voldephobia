<h1 align="center">Voldephobia</h1>

<p align="center">
  <picture width="100">
    <img src="./src/assets/favicon.svg?raw=true">
  </picture>
</p>

<p align="center">A silly little tool to find out if your dependency tree is plagued with packages from You-Know-Who</p>

---

## Basic Usage

Navigate to <a href="https://voldephobia.rschristian.dev">voldephobia.rschristian.dev</a>, input a package query (can be a bare package name or name@version), and view the resulting data tree. With this, you can see which modules are poisoned and why they're included.


## Acknowledgements

Much of the registry/module graph code was adopted from [`npmgraph`](https://github.com/npmgraph/npmgraph), the license of which can be found [here](https://github.com/npmgraph/npmgraph/blob/main/LICENSE).

## License

[MIT](https://github.com/rschristian/voldephobia/blob/master/LICENSE)
