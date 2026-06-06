# cqrsx

CQRS utilities for TypeScript applications.

`cqrsx` is set up as a pnpm workspace for building and publishing CQRS-focused packages. The repository currently contains the shared tooling, CI, and release infrastructure; package implementations should live under `packages/**`.

## Status

This project is in early development. The workspace is configured, but no publishable package has been added yet.

## Requirements

- Node.js 24.12.0 or newer
- pnpm 11.1.2 or newer

The repository enforces pnpm through the `preinstall` script.

## Getting Started

Install dependencies:

```sh
pnpm install
```

Run the test suite:

```sh
pnpm test
```

Build all workspace packages:

```sh
pnpm build
```

## Workspace Layout

```text
.
├── packages/              # Workspace packages
├── .changeset/            # Changesets release configuration
├── .github/workflows/     # Test and release workflows
├── package.json           # Root scripts and tooling
├── pnpm-workspace.yaml    # Workspace package globs
├── tsconfig.json          # Shared TypeScript configuration
└── vitest.config.ts       # Shared Vitest configuration
```

## Scripts

- `pnpm test` - run Vitest with coverage.
- `pnpm build` - run package builds through Turbo.
- `pnpm set-release` - create a Changeset.
- `pnpm release` - build, version packages, and publish workspace packages.
- `pnpm update-packages` - interactively update dependencies across the workspace.
- `pnpm clear` - remove generated output and installed dependencies.

## Adding Packages

Create packages under `packages/**` so they are picked up by the workspace:

```text
packages/
└── <package-name>/
    ├── package.json
    ├── src/
    └── tsconfig.json
```

Package builds are expected to participate in the root `pnpm build` command through Turbo.

## Releases

Releases are managed with Changesets.

1. Make changes in one or more workspace packages.
2. Run `pnpm set-release` and select the affected package versions.
3. Commit the generated `.changeset/*.md` file.
4. Push to `main`.

The release workflow creates a release pull request or publishes packages through `changesets/action`.

## CI

Pull requests that change files under `packages/**` run:

```sh
pnpm install
pnpm test
```

The shared GitHub action prepares Node.js and pnpm before each workflow.

## License

MIT
