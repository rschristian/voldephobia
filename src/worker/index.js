import { Router } from 'worktop';
import { reply } from 'worktop/response';
import { listen } from 'worktop/cfw';

import { getModuleGraph } from './util.js';

const API = new Router();

API.add('GET', '/pkg/*', async (_req, context) => {
    //const pkgQuery = decodeURIComponent(context.params.pkgQuery);
    const pkgQuery = context.params.wild;

    const headers = {
        'Content-Type': 'application/json',
        //'Cache-Control': 'public, max-age=86400, immutable',
        'Access-Control-Allow-Origin': '*',
    };

    if (!pkgQuery) return reply(400, 'Missing package query', headers)
    const graph = await getModuleGraph(pkgQuery);
    console.log(graph);
    return reply(200, JSON.stringify({ msg: 'tmp' }), headers);
});

listen(API.run);

