With **UserLand** + **OpenRouter**, you can run the full Claude Code experience right on your Android phone, no Anthropic API key needed.

---

## What You'll Need

- An Android phone with the **UserLand** app (grab it from [Play Store](https://play.google.com/store/apps/details?id=tech.ula) or [F-Droid](https://f-droid.org/packages/tech.ula/))
- An **OpenRouter** account with an API key ([sign up here](https://openrouter.ai/))

That's it. No laptop, no cloud VM.

---

## Quick Setup (Takes ~3 minutes)

Open UserLand, pick your favorite distro (Ubuntu is my favourite), and run:

```bash
# Install Claude Code globally
curl -fsSL https://claude.ai/install.sh | bash
```

---

## Wire It Up to OpenRouter

Add this to your shell config (`~/.zshrc` or `~/.bashrc`):

```bash
export OPENROUTER_API_KEY="your-openrouter-key-here"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
export ANTHROPIC_API_KEY=""  # <-- Important: explicitly empty!
export CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1
```

Then reload:

```bash
source ~/.zshrc
```

**Why the empty `ANTHROPIC_API_KEY`?** Claude Code checks this first. If it's set (even to a dummy value), it'll try Anthropic directly and fail. Setting it to `""` tells it "nope, use the gateway instead."

---

## Test Drive

```bash
claude --version          # Should print something like "1.0.x"
claude models list        # Should show OpenRouter's model catalog
```

If you see a list of models — you're live.

---

## Model Recommendations (Free on OpenRouter)

| Model | Best For |
|-------|----------|
| `nvidia/nemotron-3-ultra` | Daily driver — NVIDIA's flagship, strong reasoning & coding |
| `nvidia/nemotron-3-ultra:free` | Same model, explicitly free tier |
| `nvidia/llama-3.1-nemotron-70b-instruct` | Fast, capable, free |

**All NVIDIA models on OpenRouter are free.** Nemotron-3-Ultra is the most capable for coding and reasoning.

---

## What Gets Created

- `~/.claude/settings.json` — Your Claude Code preferences
- `~/.claude/projects/` — Session history per project

Everything lives locally on your phone. No cloud sync needed unless *you* want it.

---

## Pro Tips

- **Start in your project folder**: `cd ~/my-project && claude` — Claude Code picks up context from the current directory
- **Use `claude models list`** to see what's available on OpenRouter (they add new ones regularly)
- **Pair with a Bluetooth keyboard** for a genuinely pleasant mobile coding experience

---

You now have a pocket-sized AI pair programmer. No laptop required. Happy coding!

\- Sahu [@code.withsahu](https://instagram.com/code.withsahu)