# Workflow Protocol for 3dsolardeepagent

**Status:** Active - Enforced for all agents (Claude, Roo, etc.)
**Created:** October 29, 2025
**Source:** Adapted from 3iatlas repo strict workflow

---

## 🎯 Purpose

This protocol ensures:
- Safe development on feature branches
- No accidental changes to `main`
- User approval before destructive actions
- Evidence-based completion claims
- Honest failure reporting

---

## 📋 Quick Start for Agents

### Before EVERY Action:

1. **Type the Protocol Check:**
```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? [YES/NO]
2. DO I HAVE USER APPROVAL? [YES/NO]
3. AM I DEPLOYING TO STAGING FIRST? [YES/NO]
```

2. **Verify Current Branch:**
```bash
git branch --show-current
```

3. **If on `main`:**
```bash
# Create feature branch
git checkout -b feature/[descriptive-name]
```

4. **Ask Permission:**
"May I [specific action] on [branch name]?"

5. **Wait for Explicit Approval**

---

## 🚨 Common Scenarios

### Scenario 1: Fixing a Bug

```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? YES - feature/fix-camera-jitter
2. DO I HAVE USER APPROVAL? NO
3. AM I DEPLOYING TO STAGING FIRST? N/A

May I fix the camera jitter issue in Atlas3DTracker.tsx on feature/fix-camera-jitter?
```

**Wait for user response**

### Scenario 2: User Says "Fix the comet rendering"

```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? NO - currently on main
2. DO I HAVE USER APPROVAL? IMPLICIT (user requested fix)
3. AM I DEPLOYING TO STAGING FIRST? N/A

May I:
1. Create feature branch: feature/fix-comet-rendering
2. Make the comet rendering fixes
3. Test and provide evidence
4. Wait for approval before merging?
```

**Wait for user response**

### Scenario 3: User Says "APPROVED"

```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? YES - feature/comprehensive-improvements
2. DO I HAVE USER APPROVAL? YES (explicit approval given)
3. AM I DEPLOYING TO STAGING FIRST? N/A

Proceeding with approved changes...
```

**Then perform the work with evidence**

---

## ✅ Evidence Requirements

### When Claiming "Fixed" or "Complete":

**Must provide:**
1. Build output: `npm run build`
2. Type check: `npm run typecheck`
3. Lint check: `npm run lint`
4. Test results (if applicable)
5. Screenshot/video (for visual changes)

**Example:**
```
✅ Fixed camera jitter issue

Evidence:
- Build: PASSING (3.42s)
- TypeCheck: PASSING (no errors)
- Lint: PASSING (0 warnings)
- FPS: 60fps sustained (was 30-45fps)
- Video: [link to demo showing smooth camera]

Changes:
- Updated SceneContent.tsx (lines 145-160)
- Removed sinusoidal banking motion
- Added critically damped smoothing
```

---

## ❌ Anti-Patterns

### DON'T Do This:

```
❌ "I've fixed the issue."
❌ "The build should pass now."
❌ "This will work."
❌ *Makes changes without asking*
❌ *Works on main branch*
❌ *Skips protocol check*
```

### DO This Instead:

```
✅ "I've fixed the issue. Here's evidence: [output]"
✅ "The build passes. Output: [show npm run build]"
✅ "Here's proof it works: [screenshot/test results]"
✅ "May I fix this on feature/fix-issue?"
✅ *Works on feature branch*
✅ *Performs protocol check every time*
```

---

## 🔄 Complete Workflow Example

### User Request: "Fix the Sun movement bug"

**Agent Response:**
```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? NO - on main
2. DO I HAVE USER APPROVAL? IMPLICIT (fix requested)
3. AM I DEPLOYING TO STAGING FIRST? N/A

Reading documentation first...
[reads PROJECT_MEMORY.md]
[reads 3iatlasapps/docs/PROJECT_MEMORY.md]

Found: Sun should be locked at [0,0,0] but is drifting.

May I:
1. Create feature branch: feature/fix-sun-origin-drift
2. Modify CelestialBodies.tsx to lock Sun position
3. Test in all 3 view modes
4. Provide evidence of fix working
5. Wait for approval before merging?
```

**User:** "APPROVED"

**Agent:**
```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? Creating now...
2. DO I HAVE USER APPROVAL? YES
3. AM I DEPLOYING TO STAGING FIRST? N/A

Creating branch and proceeding...
```

*Makes changes*

```
✅ COMPLETED: Sun Origin Drift Fix

Evidence:
- Build: PASSING
- TypeCheck: PASSING
- Lint: PASSING
- Sun position verified locked at [0, 0, 0] in all frames
- Tested all 3 view modes

Files changed:
- 3iatlasapps/components/CelestialBodies.tsx (line 42)

Change summary:
Prevented Sun mesh from updating position in animation loop.
Sun.position.set(0, 0, 0) called once at creation, never updated.

May I commit this fix?
```

**User:** "Yes"

**Agent:**
```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? YES
2. DO I HAVE USER APPROVAL? YES
3. AM I DEPLOYING TO STAGING FIRST? N/A

Committing...
```

---

## 📚 Required Reading Before Starting

1. `PROJECT_MEMORY.md` (root)
2. `3iatlasapps/docs/PROJECT_MEMORY.md`
3. `.cursor/rules/strict-workflow-protocol.mdc`
4. `git log --oneline -10`

**Time investment:** 10 minutes
**Time saved:** Hours of wrong direction

---

## 🎓 For Roo (Roo-Cline) Specifically

### Roo's Workflow Integration

When Roo sees this protocol, it should:

1. **Start every response with the protocol check**
2. **Ask explicit permission before any action**
3. **Use feature branches only**
4. **Provide evidence for all claims**
5. **Update PROJECT_MEMORY.md after work**

### Roo's Task Lists

When creating task lists, include protocol checkpoints:

```markdown
**Task: Fix Camera Jitter**

- [ ] Protocol Check
- [ ] Create feature branch
- [ ] Read documentation
- [ ] Get user approval
- [ ] Make changes
- [ ] Test changes
- [ ] Provide evidence
- [ ] Wait for merge approval
```

---

## 🚦 Integration with Existing Rules

This protocol **adds to** (not replaces) existing rules:

- `.cursor/rules/horizons.mdc` - NASA data requirements
- `.cursor/rules/threejs-cameras-and-trails.mdc` - 3D scene rules
- `.cursor/rules/workflow-phases-and-tests.mdc` - Testing requirements
- `3iatlasapps/AGENTS.md` - Memory protocol

**All rules must be followed together.**

---

## 🎯 Success Metrics

### Good Agent Behavior:
- ✅ Protocol check every response
- ✅ Feature branches used
- ✅ Evidence provided
- ✅ User approval obtained
- ✅ Documentation updated

### Bad Agent Behavior:
- ❌ Skipped protocol check
- ❌ Changed main branch
- ❌ No evidence provided
- ❌ Assumed permission
- ❌ Undocumented changes

---

## 🔗 Quick Links

- **Full Protocol:** `.cursor/rules/strict-workflow-protocol.mdc`
- **Project Memory:** `PROJECT_MEMORY.md` & `3iatlasapps/docs/PROJECT_MEMORY.md`
- **Agent Guidelines:** `3iatlasapps/AGENTS.md`
- **Current Branch:** Run `git branch --show-current`

---

**Remember: This protocol exists to protect the user and the codebase. Follow it religiously.**

---

Last Updated: October 29, 2025
