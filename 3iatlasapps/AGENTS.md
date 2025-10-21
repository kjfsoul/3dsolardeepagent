# Agent Memory Protocol

## LOCAL FILES ONLY (No External MCPs)

**ByteRover MCP and other external memory tools are NOT reliable for this project.**

During intensive development sessions, external memory tools:

- Failed to persist knowledge reliably
- Failed to retrieve stored context
- Required re-explaining same concepts multiple times
- Added overhead without benefit

## Memory System That Works

### Primary Sources (In Order)

1. `/docs/PROJECT_MEMORY.md` - Source of truth, read first
2. `/docs/CURRENT_STATE.md` - What's broken right now
3. `/docs/[TASK]_TASKS.md` - Step-by-step fixes for specific issues
4. Git commit history - Permanent record
5. Inline code comments - Context where needed

### Before Starting Any Work

1. Read `/docs/PROJECT_MEMORY.md` (5 min)
2. Read `/docs/CURRENT_STATE.md` (2 min)
3. Check `git log --oneline -10` (1 min)
4. Understand what's working vs broken

### While Working

1. Make small, incremental changes
2. Test immediately after each change
3. Commit when something works
4. Document blockers in real-time

### After Completing Work

1. Update `/docs/PROJECT_MEMORY.md` with:
   - Date/Time
   - Files changed
   - What works now (✅)
   - What's broken (❌)
   - Lessons learned
   - Next steps
2. Commit documentation with code

### When Stuck (30-Minute Rule)

If blocked for >30 minutes:

1. Document exactly what was tried
2. Document exact error messages
3. Update `/docs/CURRENT_STATE.md`
4. Create/update `/docs/[ISSUE]_TASKS.md` with next steps
5. Request handoff with full context

## Anti-Patterns (Don't Do These)

❌ Rely on external memory tools without verification
❌ Skip documentation "to save time"
❌ Continue same approach for >1 hour
❌ Break working features to fix broken ones
❌ Assume context from previous sessions

## Pro-Patterns (Do These)

✅ Read docs before making changes
✅ Update docs as you work
✅ Test incrementally
✅ Commit working changes
✅ Request handoff when stuck
✅ Preserve working features

## File Structure

```
/docs/
  ├── PROJECT_MEMORY.md         # Source of truth
  ├── CURRENT_STATE.md           # Latest status
  ├── MIGRATION_TASKS.md         # Current fix tasks
  ├── RECONCILIATION_SUMMARY.md  # Project reconciliation
  └── [ISSUE]_TASKS.md          # Specific issue fixes
```

## Memory Update Template

```markdown
## Memory Update: [Date/Time]

### Context
- Working on: [task]
- Files: [list]

### What Changed
- [Specific changes]

### Status
✅ Working: [features]
❌ Broken: [issues]

### Learned
- [Key lessons]

### Next Steps
1. [Actionable task]
2. [With validation]
```

## Critical Rules

1. **Always read docs first** - 10 minutes reading saves 2 hours wrong direction
2. **Update docs in real-time** - Not "later" (you'll forget)
3. **Test incrementally** - Change → Test → Commit → Repeat
4. **Preserve working features** - Never break what works
5. **Request handoff at 30 minutes** - Don't waste hours struggling

## Success Metrics

**Good session**:

- Updated documentation ✅
- Working features preserved ✅
- Progress committed to git ✅
- Clear next steps documented ✅

**Bad session**:

- Undocumented changes ❌
- Broke working features ❌
- Unclear what was done ❌
- No clear next steps ❌

---

**Remember**: Local files are more reliable than external MCPs. Document everything. Request help early.
