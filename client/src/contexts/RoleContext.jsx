// RoleContext — provides { role, setRole, activeLearner, setActiveLearner, learners }
// Role detection: a user is a "helper" if they have an active buddy pair where
// they are the helper. Otherwise they are a "learner".
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const RoleContext = createContext(null);

/**
 * Detect role from buddy data.
 * A user is a "helper" if buddyPair exists and currentUserId === buddyPair.helper_id.
 */
function detectRole(buddyPair, currentUserId) {
  if (!buddyPair || !currentUserId) return 'learner';
  if (buddyPair.helper_id === currentUserId) return 'helper';
  return 'learner';
}

/**
 * Build learner list from buddy pair data for the helper's perspective.
 */
function buildLearnerList(buddyPair, currentUserId) {
  if (!buddyPair || !currentUserId) return [];
  if (buddyPair.helper_id !== currentUserId) return [];

  return [
    {
      id: buddyPair.learner_id,
      name: buddyPair.learner_name || 'Learner',
      status: 'offline',
      statusLabel: 'Offline',
    },
  ];
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState('learner'); // 'learner' | 'helper'
  const [activeLearner, setActiveLearner] = useState(null);
  const [learners, setLearners] = useState([]);

  /**
   * detectAndApplyRole — call this when buddy data or user data changes.
   * Automatically sets role and builds the learner list.
   */
  const detectAndApplyRole = useCallback((buddyPair, currentUserId) => {
    const detected = detectRole(buddyPair, currentUserId);
    setRole(detected);

    if (detected === 'helper') {
      const list = buildLearnerList(buddyPair, currentUserId);
      setLearners(list);

      // Restore active learner from localStorage or default to first
      const stored = localStorage.getItem('pcp-active-learner');
      const match = list.find((l) => l.id === stored);
      setActiveLearner(match || list[0] || null);
    } else {
      setLearners([]);
      setActiveLearner(null);
    }
  }, []);

  /**
   * switchLearner — switch the active learner context (for multi-learner helpers).
   */
  const switchLearner = useCallback(
    (learnerId) => {
      const found = learners.find((l) => l.id === learnerId);
      if (found) {
        setActiveLearner(found);
        localStorage.setItem('pcp-active-learner', learnerId);
      }
    },
    [learners]
  );

  const value = useMemo(
    () => ({
      role,
      setRole,
      activeLearner,
      setActiveLearner,
      learners,
      detectAndApplyRole,
      switchLearner,
    }),
    [role, activeLearner, learners, detectAndApplyRole, switchLearner]
  );

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return ctx;
}
