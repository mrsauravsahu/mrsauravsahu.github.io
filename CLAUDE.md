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

## Branching workflow

Use git worktrees for all feature work. Worktrees live in `w/` (gitignored).

```bash
# Create a new worktree + branch
git worktree add w/<short-name> -b feat/<short-name>

# Work inside the worktree
cd w/<short-name>
# ... make changes, git add, git commit ...

# Push and open a PR
git push -u origin feat/<short-name>
```

- One concern per branch — keep PRs focused.
- User reviews and merges PRs; do not merge without approval.
- After pushing a branch, share the PR creation URL from the `git push` output so the user can click it to open a PR.
- After a branch is merged, remove the worktree: `git worktree remove w/<short-name>` then `git branch -d feat/<short-name>`.
