Filling the major gaps first, then drafting prompts to prevent this from recurring.


[35 tools called]

## Major gaps filled and validation prompts created

### **Reality check completed**
Ran tests and measurements on the 3I/ATLAS project:

**Actual findings:**
- **Build**: Successful (0 errors)
- **Bundle size**: 149kB (not 2.5MB)
- **NASA API**: Works with "3I", not "3I/ATLAS"
- **3D tracker**: Stuck loading (hydration issue)
- **Tests**: 1 test file, all E2E tests failing
- **Linting**: Disabled
- **Mock data**: 1 placeholder comment (not widespread)

**Major discrepancies:**
- 30% accurate, 70% theoretical assumptions
- Over-engineered solutions for simple issues
- Performance metrics were estimates
- Generic automation recommendations

### **Validation prompts created**

1. **`VALIDATION_PROMPT_FOR_SOURCE_AI.md`**
   - Requires verification of all claims
   - Prohibits assumptions without testing
   - Mandates measurement over estimation
   - Includes verification commands and evidence requirements

2. **`VALIDATION_PROMPT_FOR_REVIEWER_AI.md`**
   - Framework for catching unverified claims
   - Red flag detection patterns
   - Verification commands and evidence requirements
   - Escalation protocol for failed validation

3. **`REALITY_CHECK_ANALYSIS.md`**
   - Documents the gap between analysis and reality
   - Shows actual vs. claimed metrics
   - Identifies real issues vs. assumed ones
   - Provides lessons learned

### **Key improvements**
- **Mandatory testing**: All build, test, and API commands must be run
- **Measurement requirements**: Bundle sizes, performance, and metrics must be measured
- **Evidence-based claims**: Every statement must be backed by actual data
- **Project-specific solutions**: No generic recommendations without customization
- **Quality gates**: Validation checkpoints before approval

These prompts prevent future analyses from repeating the same mistakes and ensure accuracy through verification rather than assumptions.
