# claude-usage-pace

A Claude Code mod that shows your Claude plan usage with a **"now" marker** on each bar, so you can see at a glance whether you're using your limits faster or slower than time is passing.

It opens a **Plan usage** pane beside the chat with:

- **Weekly usage**: a rounded bar of your weekly usage, a marker at how far through the week you are, and `Day 1.3 of 7 · 18% of week` / `Resets Sat 12:00 AM` underneath.
- **5-hour usage**: the same for the 5-hour window.

If the orange fill is left of the marker, you're under pace; if it's past the marker, you're burning faster than the window.

Usage figures only exist on a Claude subscription (Pro/Max); they update after each turn.

## Install

### Claude desktop app

1. In a Code tab session, click **+** next to the prompt box, then **Plugins**.
2. Choose **Add marketplace** and enter `Jazz23/claude-usage-pace`.
3. Choose **Add plugin** and pick **usage-pace**.

### Claude Code in a terminal

At the prompt of a session:

```
/plugin install usage-pace --marketplace Jazz23/claude-usage-pace
```

Answer `y` to add the marketplace, then press Enter to pick the user scope.

Or from a shell:

```bash
claude plugin install usage-pace --marketplace Jazz23/claude-usage-pace
```

A mod installed at the user scope from the terminal also loads in the desktop app's Code tab sessions.

## Use

The pane opens when a session starts. If you close it, type `/usage-pace` to open it again.

## Develop

Run it from a checkout with `claude --plugin-dir /path/to/claude-usage-pace`, then:

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

## License

MIT
