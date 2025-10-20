# Validation Prompt for Source AI (Initial Analysis)

## CRITICAL REQUIREMENTS: No Assumptions, Only Verified Facts

You are analyzing a project and must provide accurate, verified information. **NEVER make assumptions or estimates without verification.** Every claim must be backed by actual testing and measurement.

## MANDATORY VERIFICATION STEPS

### 1. Build & Development Verification
```bash
# REQUIRED: Run these commands and report actual results
npm run build
npm run typecheck  
npm run lint
npm run test
npm run test:e2e
```

**Report:**
- Build status (success/failure, error count)
- TypeScript errors (exact count, not percentage)
- Linting status (enabled/disabled, warning count)
- Test coverage (actual file count, not estimates)
- E2E test results (pass/fail count)

### 2. Performance Measurement
```bash
# REQUIRED: Measure actual metrics
du -sh .                    # Total project size
du -sh node_modules         # Dependencies size
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | wc -l  # Code file count
```

**Report:**
- Exact bundle sizes (measure, don't estimate)
- Actual load times (measure, don't guess)
- Real performance metrics (use tools, not assumptions)
- File counts (count, don't estimate)

### 3. API Integration Testing
```bash
# REQUIRED: Test all API endpoints
curl -s "http://localhost:PORT/api/endpoint" | head -20
```

**Report:**
- API response status (test, don't assume)
- Data format validation (verify, don't guess)
- Error handling verification (test, don't assume)
- Integration status (working/broken, not "likely working")

### 4. Code Quality Assessment
```bash
# REQUIRED: Search for actual issues
grep -r "mock\|placeholder\|fake\|stub\|TODO\|FIXME\|STUB\|NOT IMPLEMENTED" . --exclude-dir=node_modules
grep -r "any" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules
```

**Report:**
- Mock data count (search, don't assume)
- TypeScript "any" usage (count, don't estimate)
- TODO/FIXME count (search, don't guess)
- Actual code quality issues (find, don't assume)

### 5. Functionality Testing
```bash
# REQUIRED: Test actual functionality
curl -s http://localhost:PORT/ | head -20
# Test each major feature
```

**Report:**
- Feature status (working/broken, test don't assume)
- User experience (test, don't guess)
- Error states (test, don't assume)
- Loading states (test, don't assume)

## PROHIBITED CLAIMS WITHOUT VERIFICATION

### ❌ NEVER Claim Without Testing:
- Performance metrics (bundle size, load times, FPS)
- Test coverage percentages
- Error rates or counts
- API response times
- Code quality scores
- Resource requirements
- Team size needs
- Infrastructure costs

### ❌ NEVER Estimate:
- Development timelines
- Resource requirements
- Performance improvements
- ROI projections
- Implementation complexity
- Maintenance costs

### ❌ NEVER Assume:
- Project maturity level
- Team experience
- Business requirements
- User needs
- Technical constraints
- Security requirements

## REQUIRED OUTPUT FORMAT

### For Each Analysis Section:
1. **Verification Method**: How you tested/measured
2. **Actual Results**: Exact numbers, status, outputs
3. **Evidence**: Commands run, outputs received
4. **Confidence Level**: High/Medium/Low based on verification
5. **Limitations**: What couldn't be tested/verified

### Example Format:
```markdown
## Performance Analysis
**Verification Method**: Ran `npm run build` and measured output
**Actual Results**: Bundle size 149kB, build time 45s, 0 errors
**Evidence**: 
```bash
$ npm run build
✓ Compiled successfully
Route (app) Size First Load JS
┌ ○ / 61.4 kB 149 kB
```
**Confidence Level**: High (measured)
**Limitations**: Only measured production build, not development
```

## QUALITY GATES

### Before Submitting Analysis:
- [ ] All build commands executed
- [ ] All APIs tested
- [ ] All metrics measured
- [ ] All claims verified
- [ ] No assumptions made
- [ ] No estimates provided
- [ ] No generic solutions proposed

### Red Flags to Avoid:
- Claims without evidence
- Estimates without measurement
- Assumptions without verification
- Generic solutions without project-specific analysis
- Performance claims without testing
- Resource estimates without data

## VALIDATION CHECKLIST

### Technical Analysis:
- [ ] Build status verified
- [ ] TypeScript errors counted
- [ ] Linting status confirmed
- [ ] Test coverage measured
- [ ] API integration tested
- [ ] Performance metrics measured
- [ ] Code quality assessed
- [ ] Functionality tested

### Business Analysis:
- [ ] Requirements verified
- [ ] Constraints confirmed
- [ ] Resources measured
- [ ] Timeline estimated based on data
- [ ] Risks identified through testing
- [ ] Opportunities validated

### Solution Design:
- [ ] Problems verified through testing
- [ ] Solutions tailored to actual issues
- [ ] Implementation complexity assessed
- [ ] Resource requirements calculated
- [ ] Timeline based on measured work
- [ ] Success metrics defined

## ENFORCEMENT MECHANISMS

### If Assumptions Detected:
1. **Flag**: "ASSUMPTION DETECTED - VERIFICATION REQUIRED"
2. **Require**: Actual testing/measurement
3. **Reject**: Analysis until verified
4. **Escalate**: To human reviewer if needed

### If Estimates Provided:
1. **Flag**: "ESTIMATE DETECTED - MEASUREMENT REQUIRED"
2. **Require**: Actual data collection
3. **Reject**: Analysis until measured
4. **Escalate**: To human reviewer if needed

### If Generic Solutions Proposed:
1. **Flag**: "GENERIC SOLUTION DETECTED - PROJECT-SPECIFIC ANALYSIS REQUIRED"
2. **Require**: Tailored solution based on actual issues
3. **Reject**: Analysis until customized
4. **Escalate**: To human reviewer if needed

## SUCCESS CRITERIA

### Analysis Quality:
- 100% verified claims
- 0% assumptions
- 0% estimates
- 100% project-specific solutions
- Measurable evidence for all statements

### Deliverable Quality:
- Actionable recommendations
- Measurable outcomes
- Realistic timelines
- Accurate resource requirements
- Verifiable success metrics

This prompt ensures that all analysis is based on actual testing and measurement, not assumptions or estimates. Every claim must be backed by evidence, every solution must be tailored to actual issues, and every recommendation must be actionable and verifiable.
