# Research Sources MCP Server

> External genealogy source search for Claude Code via MCP

Search newspapers, WikiTree, Open Archives, and Find A Grave for family history research through Claude's Model Context Protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🗞️ **Chronicling America** - Search Library of Congress newspapers (1789-1963)
- 🌳 **WikiTree** - Collaborative genealogy tree integration
- 📚 **Open Archives** - Dutch, Belgian, and French historical records
- ⚰️ **Find A Grave** - Cemetery and burial records via FamilySearch collection
- 🔍 **Cross-Reference** - Search all sources in parallel

## Installation

### Via Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "research-sources": {
      "command": "node",
      "args": ["/path/to/research-sources-mcp-standalone/dist/index.js"]
    }
  }
}
```

### Via Docker

```bash
docker run -it research-sources-mcp
```

### From Source

```bash
git clone https://github.com/YOUR_USERNAME/research-sources-mcp
cd research-sources-mcp
npm install
npm run build
```

## Tools Available

| Tool | Description |
|------|-------------|
| `search_newspapers` | Search Chronicling America newspapers by query, state, and date range |
| `get_newspaper_page` | Get full OCR text from a specific newspaper page |
| `search_wikitree` | Search WikiTree collaborative genealogy tree |
| `get_wikitree_person` | Get detailed WikiTree profile for a person |
| `search_open_archives` | Search European historical records (Dutch, Belgian, French) |
| `search_findagrave_via_fs` | Search Find A Grave burial records via FamilySearch collection |
| `cross_reference_person` | Search ALL sources in parallel for comprehensive research |

## Usage Examples

### Search for an ancestor in newspapers

Ask Claude Code:
```
Search for obituaries for "John Smith" in California newspapers between 1920-1930
```

Claude will use:
```typescript
search_newspapers({
  query: "John Smith obituary",
  state: "California",
  start_date: "1920-01-01",
  end_date: "1930-12-31"
})
```

### Cross-reference across all sources

Ask Claude Code:
```
Search all available sources for Maria Garcia, born 1845 in Jalisco, Mexico
```

Claude will use:
```typescript
cross_reference_person({
  given_name: "Maria",
  surname: "Garcia",
  birth_year: "1845",
  birth_place: "Jalisco, Mexico",
  sources_to_search: ["all"]
})
```

### Find burial records

Ask Claude Code:
```
Find the grave for Antonio Lopez who died in San Diego around 1950
```

Claude will use:
```typescript
search_findagrave_via_fs({
  given_name: "Antonio",
  surname: "Lopez",
  death_place: "San Diego",
  death_year: "1950"
})
```

## Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/research-sources-mcp
cd research-sources-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint
npm run lint

# Format code
npm run format
```

## Architecture

- **TypeScript** - Type-safe development with strict mode
- **MCP SDK** - Official Model Context Protocol integration
- **SQLite** - Local caching of search results for performance
- **External APIs** - No authentication required for most sources
  - Chronicling America API (Library of Congress)
  - WikiTree API
  - OpenArch.nl API
  - FamilySearch Collections (Find A Grave index)

### Data Flow

```
Claude Code
    ↓
MCP Protocol (stdio)
    ↓
research-sources-mcp
    ↓
┌─────────────┬──────────────┬────────────┬──────────────┐
│ Chronicling │   WikiTree   │    Open    │ Find A Grave │
│  America    │              │  Archives  │   (via FS)   │
└─────────────┴──────────────┴────────────┴──────────────┘
    ↓
SQLite Cache (sources-cache.sqlite)
```

## Tool Reference

### `search_newspapers`

Search Chronicling America newspaper collection.

**Parameters:**
- `query` (required): Search terms (name, keywords)
- `state` (optional): US state abbreviation (e.g., "CA", "NY")
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `page` (optional): Results page number

**Returns:** Array of newspaper articles with title, date, page, OCR text snippet, and URL

### `get_newspaper_page`

Get full OCR text from a newspaper page.

**Parameters:**
- `lccn` (required): Library of Congress Control Number
- `date` (required): Issue date (YYYY-MM-DD)
- `edition` (optional): Edition number
- `page` (required): Page number

**Returns:** Full OCR text and metadata

### `search_wikitree`

Search WikiTree collaborative genealogy tree.

**Parameters:**
- `first_name` (optional): Given name
- `last_name` (required): Surname
- `birth_date` (optional): Birth year (YYYY)
- `birth_location` (optional): Birth place
- `death_date` (optional): Death year (YYYY)
- `death_location` (optional): Death place

**Returns:** Array of matching WikiTree profiles with IDs and basic info

### `get_wikitree_person`

Get detailed WikiTree profile.

**Parameters:**
- `wikitree_id` (required): WikiTree person ID (e.g., "Smith-12345")

**Returns:** Full profile with biography, relationships, sources, photos

### `search_open_archives`

Search European historical records.

**Parameters:**
- `first_name` (optional): Given name
- `last_name` (required): Surname
- `birth_year` (optional): Birth year
- `country_code` (optional): Country (NL, BE, FR)
- `source_type` (optional): civil_registration, church_records, notarial_records

**Returns:** Array of matching records with links to images

### `search_findagrave_via_fs`

Search Find A Grave burial records.

**Parameters:**
- `given_name` (optional): Given name
- `surname` (required): Surname
- `birth_year` (optional): Birth year
- `death_year` (optional): Death year
- `burial_place` (optional): Cemetery location

**Returns:** Array of Find A Grave memorial records with photos and GPS

### `cross_reference_person`

Search all sources in parallel.

**Parameters:**
- `given_name` (required): Given name
- `surname` (required): Surname
- `birth_year` (optional): Birth year
- `birth_place` (optional): Birth place
- `death_year` (optional): Death year
- `death_place` (optional): Death place
- `sources_to_search` (optional): Array of source names or ["all"]

**Returns:** Aggregated results from all requested sources

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Built as part of the FamilySearch genealogy research system. Part of a suite of MCP servers for comprehensive genealogy research:

- [familysearch-mcp](https://github.com/YOUR_USERNAME/familysearch-mcp) - FamilySearch API integration
- [tree-analyzer-mcp](https://github.com/YOUR_USERNAME/tree-analyzer-mcp) - Family tree analysis and error detection
- **research-sources-mcp** - External source search (this repository)

## Links

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Chronicling America API](https://chroniclingamerica.loc.gov/about/api/)
- [WikiTree API](https://www.wikitree.com/wiki/Help:API)
- [OpenArch.nl](https://www.openarch.nl/)

## Support

- [Issues](https://github.com/YOUR_USERNAME/research-sources-mcp/issues)
- [Discussions](https://github.com/YOUR_USERNAME/research-sources-mcp/discussions)
