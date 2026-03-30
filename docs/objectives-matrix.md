Objectives Matrix (v1.1)

Authoritative JSON: `config/objectives.matrix.json`

Schema
- version: string
- objectives[]:
  - id, title, route, anchor
  - checks:
    - dom[]: { selector, exists }
    - metrics[]: { source: "api:/...", path, op, value }
    - timing[]: { target: "page_interactive_ms", op, value }
  - logic: AND | OR (default AND)

Rule ops: ==, !=, >, >=, <, <=, contains, regex, withinMs

Adding a new objective
1) Add to JSON with proper checks
2) Ensure target page renders required `data-testid` selectors
3) Provide APIs for metrics sources
4) Run `npm run preflight`

