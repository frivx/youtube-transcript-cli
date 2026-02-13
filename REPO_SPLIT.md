# Split `packages/cli` Into a Separate GitHub Repo

Use these commands from monorepo root:

```bash
git subtree split --prefix=packages/cli -b cli-split
git remote add cli-origin https://github.com/frivxd/youtube-transcript-cli.git
git push cli-origin cli-split:main
```

After first push:

```bash
git remote remove cli-origin
git branch -D cli-split
```

This preserves CLI history for files under `packages/cli`.
