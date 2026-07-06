# CLAUDE.md

## Build system

Use `plz` directly — `./pleasew` is not needed.

```bash
plz run //apps/portfolio:local
plz run //apps/blogs:local
plz run //apps/data-store:local
```

When running from a git worktree, pass `PROJECT_ROOT` explicitly:
```bash
PROJECT_ROOT=$(pwd) plz run //apps/portfolio:local
```
