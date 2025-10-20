"use client";

/**
 * EducationalPanel Component - OFF-CANVAS Educational Content Display
 * 
 * Features:
 * - Displays educational content for selected milestones
 * - Tabbed interface (About Event, About 3I/ATLAS, The Science, Credits)
 * - Smooth slide-in animations using Framer Motion
 * - Mobile-responsive: bottom sheet on mobile, side panel on desktop
 * - Accessible with ARIA labels and keyboard navigation
 * - NOT overlaid on canvas—separate layout section
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Telescope, BookOpen, Award } from "lucide-react";
import {
  MILESTONE_CONTENT,
  GENERAL_CONTENT,
  SCIENCE_CONTENT,
  DATA_ATTRIBUTION,
  type MilestoneContent,
  formatDate
} from "@/lib/educational-content";

export interface EducationalPanelProps {
  selectedMilestone: string | null;
  onClose: () => void;
  isOpen: boolean;
  isMobile?: boolean;
}

type TabId = "event" | "about" | "science" | "credits";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "event", label: "About This Event", icon: <Info className="w-4 h-4" /> },
  { id: "about", label: "About 3I/ATLAS", icon: <Telescope className="w-4 h-4" /> },
  { id: "science", label: "The Science", icon: <BookOpen className="w-4 h-4" /> },
  { id: "credits", label: "Data & Credits", icon: <Award className="w-4 h-4" /> },
];

const EducationalPanel: React.FC<EducationalPanelProps> = ({
  selectedMilestone,
  onClose,
  isOpen,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("event");
  const [milestoneContent, setMilestoneContent] = useState<MilestoneContent | null>(null);

  // Update milestone content when selection changes
  useEffect(() => {
    if (selectedMilestone) {
      const normalizedId = selectedMilestone.toLowerCase().replace(/\s+/g, '');
      
      // Map milestone names to content IDs
      const idMap: Record<string, string> = {
        'discovery': 'discovery',
        'jwstobservation': 'jwst',
        'marsflyby': 'marsFlyby',
        'perihelion': 'perihelion'
      };
      
      const contentId = idMap[normalizedId] || normalizedId;
      const content = MILESTONE_CONTENT[contentId];
      
      setMilestoneContent(content || null);
      setActiveTab("event"); // Reset to event tab on new selection
    }
  }, [selectedMilestone]);

  // Animation variants
  const panelVariants = {
    hidden: isMobile 
      ? { y: "100%", opacity: 0 }
      : { x: "100%", opacity: 0 },
    visible: isMobile
      ? { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 200 } }
      : { x: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 200 } },
    exit: isMobile
      ? { y: "100%", opacity: 0, transition: { duration: 0.2 } }
      : { x: "100%", opacity: 0, transition: { duration: 0.2 } }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const renderEventContent = () => {
    if (!milestoneContent) {
      return (
        <div className="text-center py-8 text-gray-400">
          <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a milestone marker to view details</p>
        </div>
      );
    }

    return (
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        {/* Title and Date */}
        <div 
          className="pb-4 border-b"
          style={{ borderColor: milestoneContent.color }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            {milestoneContent.title}
          </h2>
          <p className="text-lg" style={{ color: milestoneContent.color }}>
            {milestoneContent.date}
          </p>
        </div>

        {/* What Happened */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-6 rounded" style={{ backgroundColor: milestoneContent.color }}></span>
            What Happened
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {milestoneContent.sections.whatHappened}
          </p>
        </section>

        {/* Why It Matters */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-6 rounded" style={{ backgroundColor: milestoneContent.color }}></span>
            Why It Matters
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {milestoneContent.sections.whyItMatters}
          </p>
        </section>

        {/* Scientific Facts */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-6 rounded" style={{ backgroundColor: milestoneContent.color }}></span>
            Scientific Facts
          </h3>
          <ul className="space-y-2">
            {milestoneContent.sections.scientificFacts.map((fact, index) => (
              <li key={index} className="text-gray-300 flex items-start gap-2">
                <span className="text-xs mt-1.5" style={{ color: milestoneContent.color }}>●</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Observations */}
        {milestoneContent.sections.observations.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-6 rounded" style={{ backgroundColor: milestoneContent.color }}></span>
              Key Observations
            </h3>
            <ul className="space-y-2">
              {milestoneContent.sections.observations.map((obs, index) => (
                <li key={index} className="text-gray-300 flex items-start gap-2">
                  <span className="text-xs mt-1.5" style={{ color: milestoneContent.color }}>●</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Fun Facts */}
        {milestoneContent.sections.funFacts.length > 0 && (
          <section className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-xl">✨</span>
              Fun Facts
            </h3>
            <ul className="space-y-2">
              {milestoneContent.sections.funFacts.map((fact, index) => (
                <li key={index} className="text-gray-300 text-sm leading-relaxed flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </motion.div>
    );
  };

  const renderAboutContent = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          {GENERAL_CONTENT.title}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-6">
          {GENERAL_CONTENT.sections.overview}
        </p>
      </div>

      <section>
        <h3 className="text-lg font-semibold text-blue-400 mb-3">Physical Characteristics</h3>
        <ul className="space-y-2">
          {GENERAL_CONTENT.sections.physicalCharacteristics.map((item, index) => (
            <li key={index} className="text-gray-300 flex items-start gap-2">
              <span className="text-blue-400 text-xs mt-1.5">●</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-green-400 mb-3">Orbital Dynamics</h3>
        <ul className="space-y-2">
          {GENERAL_CONTENT.sections.orbitalDynamics.map((item, index) => (
            <li key={index} className="text-gray-300 flex items-start gap-2">
              <span className="text-green-400 text-xs mt-1.5">●</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-purple-400 mb-3">Scientific Significance</h3>
        <ul className="space-y-2">
          {GENERAL_CONTENT.sections.scientificSignificance.map((item, index) => (
            <li key={index} className="text-gray-300 flex items-start gap-2">
              <span className="text-purple-400 text-xs mt-1.5">●</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-yellow-400 mb-3">Composition</h3>
        <ul className="space-y-2">
          {GENERAL_CONTENT.sections.composition.map((item, index) => (
            <li key={index} className="text-gray-300 flex items-start gap-2">
              <span className="text-yellow-400 text-xs mt-1.5">●</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </motion.div>
  );

  const renderScienceContent = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">The Science Behind 3I/ATLAS</h2>
        <p className="text-gray-400 leading-relaxed">
          Deep dive into the scientific questions and discoveries surrounding this ancient interstellar visitor.
        </p>
      </div>

      {SCIENCE_CONTENT.map((section, index) => (
        <section key={index} className="bg-white/5 rounded-lg p-5 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">{section.title}</h3>
          
          <div className="space-y-3 mb-4">
            {section.content.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-gray-300 leading-relaxed text-sm">
                {paragraph}
              </p>
            ))}
          </div>

          {section.highlights.length > 0 && (
            <div className="bg-white/5 rounded p-3 border-l-2 border-cyan-400">
              <p className="text-cyan-400 text-xs font-semibold mb-2 uppercase">Key Highlights</p>
              <ul className="space-y-1">
                {section.highlights.map((highlight, hIndex) => (
                  <li key={hIndex} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
    </motion.div>
  );

  const renderCreditsContent = () => (
    <motion.div
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Data Sources & Credits</h2>
        <p className="text-gray-400 leading-relaxed mb-6">
          This visualization uses real orbital data and scientific findings from leading space agencies and observatories worldwide.
        </p>
      </div>

      <section className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg p-5 border border-blue-400/30">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Primary Data Source</h3>
        <p className="text-white text-xl font-bold">{DATA_ATTRIBUTION.primary}</p>
        <p className="text-gray-300 text-sm mt-2">
          All trajectory data is calculated using NASA's Jet Propulsion Laboratory Horizons System, 
          ensuring scientifically accurate representations of orbital mechanics.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Contributing Sources</h3>
        <ul className="space-y-2">
          {DATA_ATTRIBUTION.sources.map((source, index) => (
            <li key={index} className="text-gray-300 flex items-start gap-2">
              <span className="text-green-400 text-xs mt-1.5">●</span>
              <span>{source}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Scientific Publications</h3>
        <ul className="space-y-2">
          {DATA_ATTRIBUTION.publications.map((pub, index) => (
            <li key={index} className="text-gray-300 flex items-start gap-2">
              <span className="text-yellow-400 text-xs mt-1.5">●</span>
              <span>{pub}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white/5 rounded-lg p-4 border border-white/10 text-center">
        <p className="text-gray-400 text-sm">
          Last Updated: {DATA_ATTRIBUTION.lastUpdated}
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Educational content compiled from peer-reviewed scientific literature and official space agency releases.
        </p>
      </section>

      <section className="text-center pt-4">
        <p className="text-gray-500 text-xs">
          Visualization created by the 3IAtlas Project
        </p>
        <p className="text-gray-600 text-xs mt-1">
          For educational and research purposes
        </p>
      </section>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "event":
        return renderEventContent();
      case "about":
        return renderAboutContent();
      case "science":
        return renderScienceContent();
      case "credits":
        return renderCreditsContent();
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`
            fixed bg-black/95 backdrop-blur-md border-white/20
            ${isMobile 
              ? 'bottom-0 left-0 right-0 h-[70vh] border-t rounded-t-2xl' 
              : 'top-0 right-0 w-[450px] h-full border-l'
            }
          `}
          style={{ zIndex: 100 }}
          role="dialog"
          aria-labelledby="educational-panel-title"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 
              id="educational-panel-title" 
              className="text-lg font-semibold text-white"
            >
              {milestoneContent ? milestoneContent.title : "3I/ATLAS Information"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }
                `}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100%-8rem)] p-6">
            <AnimatePresence mode="wait">
              {renderTabContent()}
            </AnimatePresence>
          </div>

          {/* Mobile swipe indicator */}
          {isMobile && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2">
              <div className="w-12 h-1 bg-white/30 rounded-full"></div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EducationalPanel;
