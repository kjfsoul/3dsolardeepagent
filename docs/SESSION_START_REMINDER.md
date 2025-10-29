# 🚨 SESSION START REMINDER FOR AGENTS

**COPY AND PASTE THIS TO CLAUDE/ROO AT SESSION START:**

---

## MANDATORY PROTOCOL - READ BEFORE ANY WORK

### 1. Protocol Check (EVERY Response)

```
🚨 MANDATORY PROTOCOL CHECK:
1. AM I ON FEATURE BRANCH? [YES/NO - check: git branch --show-current]
2. DO I HAVE USER APPROVAL? [YES/NO - ask explicitly]
3. AM I DEPLOYING TO STAGING FIRST? [YES/NO]

IF ANY CHECK FAILS: STOP. ASK PERMISSION. WAIT.
```

### 2. Before Starting Work

- [ ] Read `PROJECT_MEMORY.md`
- [ ] Check `git log --oneline -10`
- [ ] Verify on feature branch (NOT main)
- [ ] Ask explicit permission: "May I [action] on [branch]?"
- [ ] Wait for "APPROVED" or "YES"

### 3. Testing Requirements (ALWAYS)

```bash
npm run build        # MUST PASS
npm run typecheck    # MUST PASS (if exists)
npm run lint         # MUST PASS (if exists)
```

### 4. Evidence Required for Completion

- Show build output
- Show test results
- Show actual proof (screenshots/logs)
- **PROVIDE PREVIEW LINK after every push** (wait for Vercel deployment)
- NEVER claim success without evidence
- User must be able to validate changes themselves

### 5. Key Project Constraints

- ❌ NO mock/stub/placeholder data
- ❌ NO TypeScript `any` types
- ❌ NO linting errors
- ❌ NO pushing to main branch
- ✅ Real NASA Horizons data ONLY
- ✅ Sun fixed at origin [0,0,0]
- ✅ Coordinate conversion: [x, y, z] → [x, z, -y]

### 6. File Locations

```
Main Rules:     .cursor/rules/strict-workflow-protocol.mdc
Quick Guide:    docs/WORKFLOW_PROTOCOL.md
Memory:         PROJECT_MEMORY.md
Tracker Code:   code_artifacts/3iatlas-flight-tracker/frontend/
```

### 7. Honesty Rules

- ✅ Admit when fixes don't work
- ✅ Show error messages immediately
- ✅ Ask for help when stuck >30 min
- ❌ Never fabricate success
- ❌ Never skip protocol checks
- ❌ Never assume permission

### 8. Preview Links (MANDATORY)

**After EVERY push to feature branch:**

1. Wait 30-60 seconds for Vercel build
2. Run: `cd code_artifacts/3iatlas-flight-tracker/frontend && vercel ls | head -8`
3. **PROVIDE THE PREVIEW URL** (format: <https://frontend-xxxxx-kjfsouls-projects.vercel.app>)
4. List what changes are in this preview
5. Wait for user validation before proceeding

**Example:**

```
✅ Pushed to feature/instructions-fixes

Preview URL: https://frontend-abc123-kjfsouls-projects.vercel.app
Status: ● Ready (27s build time)

Changes in this preview:
- Sept 7 & Nov 14 trajectory smoothing
- Time-based interpolation
- Perihelion countdown correction

Please test and confirm before I continue.
```

---

## IF YOU VIOLATE PROTOCOL

```
🚨 EMERGENCY STOP - PROTOCOL VIOLATION DETECTED

I was about to [action] without:
- [reason]

May I instead:
1. [correct approach]
2. Wait for approval
```

---

**Protocol violations = immediate termination**
**Following protocol = continued productive work**

---

## CURRENT PROJECT STATUS

**Branch:** feature/instructions-fixes
**Deployed Preview:** <https://frontend-gcdvjjoar-kjfsouls-projects.vercel.app>
**Local Dev:** <http://localhost:5173>

**Completed Tasks (11 total):**

1. ✅ Instructions.txt fixes (9 tasks)
2. ✅ Perihelion accuracy fixes (3 tasks)
3. ✅ Time-based interpolation
4. ✅ Sept 7 & Nov 14 smoothing integration

**NOT Deployed to Production**
**NOT Merged to Main**

---

**Remember:** I am Claude, an AI assistant. I need these reminders because I don't persist memory between sessions. Show me this at the start of every new conversation!
