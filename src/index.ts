#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  SearchNewspapersSchema,
  handleSearchNewspapers,
  GetNewspaperPageSchema,
  handleGetNewspaperPage,
} from './tools/newspaper-tools.js';
import {
  SearchWikiTreeSchema,
  handleSearchWikiTree,
  GetWikiTreePersonSchema,
  handleGetWikiTreePerson,
} from './tools/wikitree-tools.js';
import {
  SearchOpenArchivesSchema,
  handleSearchOpenArchives,
} from './tools/openarch-tools.js';
import {
  CrossReferencePersonSchema,
  handleCrossReferencePerson,
} from './tools/cross-reference-tools.js';
import { closeDb } from './cache/db.js';

const server = new Server(
  {
    name: 'research-sources-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_newspapers',
        description: 'Search Chronicling America (Library of Congress) historic newspapers (1789-1963)',
        inputSchema: SearchNewspapersSchema,
      },
      {
        name: 'get_newspaper_page',
        description: 'Get full OCR text and image for a specific newspaper page',
        inputSchema: GetNewspaperPageSchema,
      },
      {
        name: 'search_wikitree',
        description: 'Search WikiTree collaborative genealogy tree',
        inputSchema: SearchWikiTreeSchema,
      },
      {
        name: 'get_wikitree_person',
        description: 'Get detailed profile for a WikiTree person',
        inputSchema: GetWikiTreePersonSchema,
      },
      {
        name: 'search_open_archives',
        description: 'Search Open Archives (Dutch, Belgian, French historical records)',
        inputSchema: SearchOpenArchivesSchema,
      },
      {
        name: 'cross_reference_person',
        description: 'Search ALL external sources in parallel for a person (newspapers, WikiTree, Open Archives)',
        inputSchema: CrossReferencePersonSchema,
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case 'search_newspapers':
        return { content: [{ type: 'text', text: await handleSearchNewspapers(SearchNewspapersSchema.parse(request.params.arguments)) }] };
      case 'get_newspaper_page':
        return { content: [{ type: 'text', text: await handleGetNewspaperPage(GetNewspaperPageSchema.parse(request.params.arguments)) }] };
      case 'search_wikitree':
        return { content: [{ type: 'text', text: await handleSearchWikiTree(SearchWikiTreeSchema.parse(request.params.arguments)) }] };
      case 'get_wikitree_person':
        return { content: [{ type: 'text', text: await handleGetWikiTreePerson(GetWikiTreePersonSchema.parse(request.params.arguments)) }] };
      case 'search_open_archives':
        return { content: [{ type: 'text', text: await handleSearchOpenArchives(SearchOpenArchivesSchema.parse(request.params.arguments)) }] };
      case 'cross_reference_person':
        return { content: [{ type: 'text', text: await handleCrossReferencePerson(CrossReferencePersonSchema.parse(request.params.arguments)) }] };
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: errorMessage }) }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on('SIGINT', () => {
    closeDb();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    closeDb();
    process.exit(0);
  });

  console.error('Research Sources MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
