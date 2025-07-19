# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

## Project structure

```
backend/
├── index.ts                    # Main server entry point
├── package.json               # Dependencies
├── tsconfig.json             # TypeScript config
├── bun.lock                  # Bun lock file
├── CLAUDE.md                 # Claude instructions
├── README.md                 # Project documentation
├── TODO.md                   # Task list
└── src/
    ├── routes/               # API endpoints
    ├── services/            # Business logic
    │   ├── common/          # Shared services
    │   ├── mixin/           # Service mixins
    │   ├── strategy/        # Trading strategies
    │   └── tee/             # TEE
    ├── types/               # TypeScript types
    ├── utils/               # Utility functions
    └── tests/               # Test files
```