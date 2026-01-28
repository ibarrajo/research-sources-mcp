# Contributing to Research Sources MCP

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Prerequisites**
   - Node.js 18.0.0 or higher
   - npm or yarn
   - Git

2. **Clone and Install**
   ```bash
   git clone https://github.com/ibarrajo/research-sources-mcp
   cd research-sources-mcp
   npm install
   ```

3. **Development Workflow**
   ```bash
   # Run in development mode with auto-reload
   npm run dev

   # Build the project
   npm run build

   # Run tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Check test coverage
   npm run test:coverage

   # Lint code
   npm run lint

   # Auto-fix linting issues
   npm run lint:fix

   # Format code
   npm run format
   ```

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Add JSDoc comments for all public functions
- Follow existing code style (enforced by ESLint and Prettier)
- Prefer interfaces over types for object shapes
- Use explicit return types on functions

### Testing

- Write tests for all new features
- Maintain 70%+ code coverage
- Test both success and error cases
- Use descriptive test names: `should [expected behavior] when [condition]`

Example:
```typescript
describe('search_newspapers', () => {
  it('should return results when valid query provided', async () => {
    const results = await searchNewspapers({
      query: 'test',
      state: 'CA'
    });
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    // Test error handling
  });
});
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Build process or tooling changes

Examples:
```
feat: add support for date range filtering in newspaper search
fix: handle missing OCR text in newspaper results
docs: update README with WikiTree examples
test: add integration tests for OpenArch API
```

## Adding New Sources

To add a new external source:

1. **Create source module** in `src/sources/`:
   ```typescript
   // src/sources/new-source.ts
   export interface NewSourceParams {
     // Define parameters
   }

   export async function searchNewSource(params: NewSourceParams) {
     // Implementation
   }
   ```

2. **Add tool** in `src/tools/`:
   ```typescript
   // src/tools/new-source-tools.ts
   import { searchNewSource } from '../sources/new-source';

   export const newSourceTools = {
     search_new_source: {
       description: 'Search the new source',
       inputSchema: {
         // JSON schema
       },
       handler: async (params: any) => {
         return await searchNewSource(params);
       }
     }
   };
   ```

3. **Register tool** in `src/index.ts`:
   ```typescript
   import { newSourceTools } from './tools/new-source-tools';

   // In server.setRequestHandler
   for (const [name, tool] of Object.entries(newSourceTools)) {
     // Register
   }
   ```

4. **Write tests** in `__tests__/`:
   ```typescript
   // __tests__/new-source.test.ts
   describe('New Source', () => {
     // Tests
   });
   ```

5. **Update documentation**:
   - Add to README.md "Tools Available" table
   - Add usage example
   - Update CHANGELOG.md

## Testing Guidelines

### Unit Tests

Test individual functions in isolation:

```typescript
describe('parseDate', () => {
  it('should parse YYYY-MM-DD format', () => {
    expect(parseDate('2020-01-15')).toEqual(new Date(2020, 0, 15));
  });
});
```

### Integration Tests

Test API interactions:

```typescript
describe('Chronicling America API', () => {
  it('should search newspapers successfully', async () => {
    const results = await searchNewspapers({
      query: 'genealogy',
      state: 'CA',
      start_date: '1900-01-01',
      end_date: '1900-12-31'
    });
    expect(results).toBeDefined();
  });
});
```

### Mock External APIs

Use mocks for external API calls to avoid:
- Rate limiting
- Network dependency
- Slow tests

```typescript
jest.mock('../src/sources/chronicling-america', () => ({
  searchNewspapers: jest.fn().mockResolvedValue([
    { title: 'Test', date: '1900-01-01' }
  ])
}));
```

## Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feat/add-new-source
   ```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test thoroughly**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add support for new genealogy source"
   ```

5. **Push and create PR**
   ```bash
   git push origin feat/add-new-source
   ```

6. **PR Requirements**
   - All tests pass
   - No linting errors
   - Code coverage maintained or improved
   - Documentation updated
   - Meaningful commit messages

## Code Review

All contributions require code review. Reviewers will check:

- Code quality and style
- Test coverage
- Documentation completeness
- Performance implications
- Security considerations

## Bug Reports

When reporting bugs, include:

1. **Environment**
   - Node.js version
   - Operating system
   - MCP client (Claude Desktop, etc.)

2. **Steps to reproduce**
   - Exact commands or tool calls
   - Input parameters
   - Expected vs actual behavior

3. **Logs**
   - Error messages
   - Stack traces
   - Relevant console output

## Feature Requests

For new features:

1. **Use case**: Describe the research problem you're trying to solve
2. **Proposed solution**: How should it work?
3. **Alternatives**: What alternatives have you considered?
4. **Data sources**: Which external APIs or collections would be needed?

## Questions?

- Open an issue for questions
- Join discussions on GitHub Discussions
- Check existing issues and PRs first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
