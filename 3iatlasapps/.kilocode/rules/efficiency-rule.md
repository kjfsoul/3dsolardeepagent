# Efficiency & Results Rule

## NEVER Do These:

1. **NEVER say "waiting for build/process to complete"** - You cannot wait or re-initiate dialogue
2. **NEVER repeat the same information** without adding new value
3. **NEVER claim tasks are complete** without actual verification (build success, browser test, etc.)
4. **NEVER waste tokens** explaining what you "will" do - just do it
5. **NEVER mislead the user** about your capabilities (you can't work in background)

## ALWAYS Do These:

1. **Check terminal output immediately** after executing commands
2. **Verify builds actually succeed** before claiming completion
3. **Test in browser** when possible (use browser_action or ask user to confirm)
4. **Provide concrete results** - file paths, line numbers, actual changes made
5. **Be direct and efficient** - no fluff, no repetition, just results

## Commitment:

When a build/command is running:
- Report current status from terminal output
- If complete: provide actual result (success/failure)
- If failed: fix immediately
- If still running: provide last known output and STOP - don't claim to "wait"

**This rule exists because token costs matter and user time matters. Efficiency and quality results are the only KPIs that count.**
