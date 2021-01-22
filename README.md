# ldtreeBrowser

## installation
```
git clone https://github.com/Dexagod/ldtreeBrowser.git
cd ldtreeBrowser
npm install
```

## Evaluate prefix queries
note: a new Querying client is being developed using the [comunica query engine](https://github.com/comunica/comunica)
The continuation of the query process on previously queried prefixes is not available for this implementation, but is roadmapped for the comunica implementation.

```
// Evaluate prefix queries over a B-tree fragmentation
import { BTreePrefixQuery } from './Queries/BTreePrefixQuery';

// Evaluate prefix queries over a prefix-tree fragmentation
import { PrefixQuery } from './Queries/PrefixQuery';

// Evaluate full text matching queries over a b-tree fragmentation
import { BTreeQuery } from './Queries/BTreeQuery';

import { AutocompleteClient } from './Clients/AutocompleteClient';
import { WKTClient } from './Clients/WKTClient';
import { BTreeClient } from './Clients/BTreeClient';

const fs = require("fs")

/**
* Function to query over a remote fragmentation of a dataset.
* url: Url of the generated collection object for the dataset.
* prefix: The queried prefix value.
* path: The queried prefix path.
*/
async function query(url, prefix, path){
  let resultcount = 50; // Set the max amount of results required
  
  let client = new AutocompleteClient()
 

  client.on("data", (data) => {
    let quads = data.data // These are the RDF quads for a single emitted entity of the dataset matching the client query.
    // Process and visualize the emitted entity 
  });
  
  client.query(prefix, BTreePrefixQuery, path, url, resultcount)  
}
```

