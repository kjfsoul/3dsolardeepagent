# **The ATLAS Directive: Final Consolidated Execution Plan**

## **Objective: Achieve Market Dominance through Phased, Parallel-Path Development**

Date: October 1, 2025  
Status: Supersedes all previous task plans. This is the new source of truth.

### **Core Strategy**

We will execute development in three parallel tracks to maximize speed and efficiency. The goal is to launch the core, polished 3D experience immediately, follow up rapidly with the narrative engagement engine, and then layer in the supporting features that create a content "moat" around the project.

* **Track 1: Core Experience (Lead Dev)** \- Focuses on the primary 3D visualization.  
* **Track 2: Narrative & Engagement (Content/Frontend Dev)** \- Focuses on The ATLAS Directive game and its integration.  
* **Track 3: Supporting Pillars (Full Stack/Backend Dev)** \- Focuses on the features that provide fresh content and community interaction.

### **Track 1: Core Experience \- The 3D Trajectory Simulator**

Lead: Lead Developer  
Goal: Create the most advanced, cinematic, and scientifically accurate 3I/ATLAS visualization on the web.

#### **Task 1.1: Immediate Bug Fixes & Polish (Priority 1, Sequential)**

*This must be completed before any other 3D work begins.*

1. **Objective:** Resolve the critical bugs from PROJECT\_HANDOFF\_COMPLETE.md.  
2. **File:** /components/Atlas3DTrackerEnhanced.tsx  
3. **Checklist:**  
   * \[ \] **Lock Sun at Origin:** Ensure the Sun is fixed at \[0,0,0\] in the animation loop.  
   * \[ \] **Repair "Follow 3I/ATLAS" Camera:** Stabilize the camera tracking to be smooth and reliable.  
   * \[ \] **Amplify Comet Motion:** Increase the simulation's time scale to make the comet's movement visually apparent and engaging.  
   * \[ \] **Visual Polish:** Add a basic particle trail and bloom/glow effect as a baseline.

#### **Task 1.2: Advanced Feature Implementation (Run in Parallel after 1.1)**

1. **Objective:** Evolve the tracker into a full "Trajectory Simulator" as defined in HORIZONS\_ENHANCEMENT\_PLAN.md.  
2. **File:** /components/Atlas3DTrackerEnhanced.tsx, new UI control components.  
3. **Checklist:**  
   * \[ \] **Planetary Context:** Add and label the orbits and positions for Earth and Mars.  
   * \[ \] **Cinematic Cameras:** Implement "Top-Down Solar System" and "Ride the Comet" camera modes with smooth Framer Motion or Tween.js transitions.  
   * \[ \] **Interactive Timeline:** Enhance the slider to scrub through the entire October 2025 perihelion period, updating all planetary and object positions in real-time. Add data overlays for date, speed, and distance from Earth.  
   * \[ \] **Animation Hook Integration:** Refactor the component to accept an animation\_key prop. Based on this key (e.g., 'warning', 'artifact'), trigger a pre-defined cinematic sequence (e.g., altering the trajectory line color, initiating a camera pan to Mars, making the comet model flicker).

### **Track 2: Narrative & Engagement \- The ATLAS Directive**

Lead: Content Agent / Frontend Developer  
Goal: Build and integrate the narrative engine that drives user retention, data capture, and monetization.

#### **Task 2.1: Narrative Content Generation (Run in Parallel)**

1. **Objective:** Create the full narrative\_tree.json file.  
2. **Directive:** Execute the Agent Brief: Narrative Content Generation for 'The ATLAS Directive' (v2) (docs/NARRATIVE\_RESEARCH\_AGENT\_PROMPT.md).  
3. **Agent(s):** Claude 4.5 Sonnet (for creative/philosophical questions), ChatGPT 5 Pro (for structured data/fact-checks), Z.AI GLM-4.6 (for cross-validation). Use a multi-agent approach where one generates and the others critique and refine based on the brief's pillars.  
4. **Output:** A single, validated narrative\_tree.json file placed in /data/narrative\_tree.json.

#### **Task 2.2: Frontend Component Integration (Run in Parallel with 2.1)**

1. **Objective:** Integrate the AtlasDirective.tsx component into the main page and connect it to the 3D tracker.  
2. **Files:** /app/page.tsx, /components/AtlasDirective.tsx  
3. **Checklist:**  
   * \[ \] **Component Placement:** Add the AtlasDirective component to the main page layout.  
   * \[ \] **Data Loading:** Ensure the component correctly fetches and parses /data/narrative\_tree.json.  
   * \[ \] **State Management:** Implement the onOutcomeDetermined callback function in page.tsx. Manage the outcome state.  
   * \[ \] **Prop Drilling:** Pass the animation\_key from the outcome state as a prop to the Atlas3DTrackerEnhanced component.  
   * \[ \] **Token UI:** Build the UI for the Chrono-Token system, including displaying the token count and the prompts for purchasing or sharing to earn more.

### **Track 3: Supporting Pillars \- Content & Community**

Lead: Full Stack Developer  
Goal: Deploy the automated content and community features that establish the site's authority and provide continuous value.

#### **Task 3.1: Live "Broadcasts" Section (Run in Parallel)**

1. **Objective:** Implement the automated article-fetching system from 3I:Atlas Features.pdf.  
2. **Files:** All files specified in "TASK 1 \- Broadcasts/Articles".  
3. **Checklist:**  
   * \[ \] Set up Vercel Blob storage and BLOB\_READ\_WRITE\_TOKEN.  
   * \[ \] Deploy the API routes (/api/articles/refresh, /api/articles).  
   * \[ \] Integrate the LatestArticles.tsx component onto the homepage.  
   * \[ \] Activate the vercel.json cron job for daily updates.

#### **Task 3.2: "Ask ATLAS" AI Chatbot (Run in Parallel)**

1. **Objective:** Deploy the conversational AI defined in CONTENT\_STRATEGY\_DOMINANCE.md.  
2. **Checklist:**  
   * \[ \] Use the Vercel AI SDK to integrate an OpenAI API endpoint.  
   * \[ \] Create a system prompt that is fed the entire content of 3I\_ATLAS\_KNOWLEDGE\_BASE.md.  
   * \[ \] Add the chatbot as a floating widget on the site.

#### **Task 3.3: UI/UX Polish (Run in Parallel)**

1. **Objective:** Address minor but important UI issues.  
2. **Checklist:**  
   * \[ \] **Product De-duplication:** Implement the de-duping logic from 3I:Atlas Features.pdf across all product carousels.  
   * \[ \] **UI Text Cleanup:** Remove all developer-facing text from the UI as specified in HORIZONS\_ENHANCEMENT\_PLAN.md. Replace with user-friendly labels and tooltips.

### **Execution Flow & Dependencies**

* **Parallel Starts:** All three tracks can begin simultaneously.  
  * The Lead Dev can immediately start on **Task 1.1**.  
  * The Content Agent can immediately start on **Task 2.1**.  
  * The Full Stack Dev can immediately start on **Track 3** tasks.  
* **Key Dependency:** The final integration of the full experience (Atlas Directive controlling the 3D Tracker) depends on the completion of **Task 1.2 (Animation Hook)** and **Task 2.2 (State Management)**. These two tasks form the critical integration point for the two main tracks.  
* **Launch Sequence:**  
  1. **Initial Launch (Day 1):** Deploy the results of **Task 1.1** and **Task 3.3** as soon as they are complete. This gives you a polished, functional site with the core 3D viewer.  
  2. **Phase 2 Launch (Day 2-3):** Deploy the completed Atlas Directive game (**Task 2.1 \+ 2.2**) and the supporting content pillars (**Task 3.1 \+ 3.2**).  
  3. **Continuous Deployment:** The advanced 3D features from **Task 1.2** can be deployed incrementally as they are completed, providing a steady stream of "new features" to announce and market.