# AI AGENT COORDINATION SYSTEM

## CONTEXT & MEMORY MANAGEMENT

### 1. SHARED CONTEXT REPOSITORY
**Location**: `prompts/agent-context/`
- `current-state.md` - Real-time project status
- `completed-tasks.md` - Verified completed work
- `active-branches.md` - Current working branches per agent
- `blocking-issues.md` - Issues preventing progress
- `verification-log.md` - Evidence of all verifications

### 2. AGENT MEMORY PROTOCOL
**Each agent must:**
- Read context before starting work
- Update context after completing work
- Verify all claims with evidence
- Document all changes made
- Check for conflicts with other agents

### 3. BRANCH MANAGEMENT SYSTEM
**Branch Naming Convention:**
- `agent-name/task-id/description`
- Examples: `roo/nasa-api-fix`, `cursor/hydration-fix`, `claude/testing-infra`

**Branch Protection:**
- No direct commits to main
- All work on feature branches
- Required verification before merge
- Agent-specific working directories

### 4. TASK COORDINATION PROTOCOL
**Task Assignment:**
- Assign specific tasks to specific agents
- Create agent-specific branches
- Provide complete context
- Set verification requirements

**Progress Tracking:**
- Update task status in shared context
- Document evidence of completion
- Flag blocking issues immediately
- Coordinate handoffs between agents

### 5. VERIFICATION REQUIREMENTS
**Before Starting Work:**
- Read current project state
- Check for existing work on task
- Verify branch is correct
- Confirm no conflicts

**During Work:**
- Test every change
- Measure every metric
- Verify every claim
- Document all evidence

**After Work:**
- Update shared context
- Provide evidence of completion
- Flag any issues found
- Prepare handoff documentation

### 6. CONFLICT PREVENTION
**File-Level Coordination:**
- Agent-specific working directories
- Clear file ownership
- Communication before shared changes
- Merge conflict resolution protocol

**Code-Level Coordination:**
- Feature flags for incomplete work
- Staging branches for integration
- Automated conflict detection
- Manual review for critical changes

### 7. HANDOFF PROTOCOL
**When Passing Work:**
- Complete current task fully
- Update shared context
- Document all changes
- Provide clear handoff instructions
- Verify recipient has all context

**When Receiving Work:**
- Read all handoff documentation
- Verify current state
- Test existing functionality
- Confirm understanding of requirements
- Begin work with verification

### 8. EMERGENCY PROTOCOLS
**If Work Conflicts:**
- Stop immediately
- Communicate with other agents
- Resolve conflicts before proceeding
- Update shared context
- Restart with clear coordination

**If Context Lost:**
- Re-read shared context
- Verify current state
- Check for completed work
- Restore missing information
- Continue with verification

---

## IMPLEMENTATION CHECKLIST

### Setup Phase:
- [ ] Create shared context repository
- [ ] Set up branch protection rules
- [ ] Create agent-specific directories
- [ ] Establish communication protocols
- [ ] Test coordination system

### Execution Phase:
- [ ] Assign tasks to specific agents
- [ ] Create agent-specific branches
- [ ] Provide complete context
- [ ] Monitor progress and conflicts
- [ ] Coordinate handoffs

### Verification Phase:
- [ ] Verify all work completed
- [ ] Test all functionality
- [ ] Measure all metrics
- [ ] Document all evidence
- [ ] Prepare for production

---

**This system ensures no work is undone, no conflicts occur, and all agents work with complete context and memory.**
