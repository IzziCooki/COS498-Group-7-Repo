const { matchSkill, buildSkillPrompt, getSkillsSummary, getAllSkills } = require('../core/skillMatcher');

describe('skillMatcher', () => {
  describe('skill loading', () => {
    it('loads all skill JSON files from server/skills/', () => {
      const skills = getAllSkills();
      expect(skills.length).toBeGreaterThanOrEqual(24);
    });

    it('every skill has required fields', () => {
      const skills = getAllSkills();
      for (const skill of skills) {
        expect(skill.id).toBeDefined();
        expect(skill.name).toBeDefined();
        expect(skill.triggers).toBeDefined();
        expect(Array.isArray(skill.triggers)).toBe(true);
        expect(skill.triggers.length).toBeGreaterThan(0);
        expect(skill.prompt).toBeDefined();
        expect(skill.category).toBeDefined();
        expect(skill.difficulty).toBeDefined();
      }
    });

    it('includes the original teaching skills', () => {
      const skills = getAllSkills();
      const ids = skills.map(s => s.id);
      expect(ids).toContain('copy-paste');
      expect(ids).toContain('wifi');
      expect(ids).toContain('send-email');
      expect(ids).toContain('screenshot');
    });

    it('includes the new diagnostic skills', () => {
      const skills = getAllSkills();
      const ids = skills.map(s => s.id);
      expect(ids).toContain('diagnose_system');
      expect(ids).toContain('network_fix');
      expect(ids).toContain('slow_computer');
      expect(ids).toContain('disk_cleanup');
      expect(ids).toContain('app_troubleshoot');
      expect(ids).toContain('battery_power');
      expect(ids).toContain('system_checkup');
    });
  });

  describe('matchSkill — diagnostic routing', () => {
    it('matches "my computer keeps freezing" to diagnose_system', () => {
      const match = matchSkill('my computer keeps freezing');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('diagnose_system');
    });

    it('matches "everything is so slow" to slow_computer', () => {
      const match = matchSkill('everything is so slow and laggy');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('slow_computer');
    });

    it('matches "my computer is really slow" to slow_computer', () => {
      const match = matchSkill('my computer is really slow');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('slow_computer');
    });

    it('matches "I ran out of space" to disk_cleanup', () => {
      const match = matchSkill('I ran out of space');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('disk_cleanup');
    });

    it('matches "Zoom is not working" to app_troubleshoot', () => {
      const match = matchSkill('Zoom is not working');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('app_troubleshoot');
    });

    it('matches "my battery keeps dying" to battery_power', () => {
      const match = matchSkill('my battery keeps dying');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('battery_power');
    });

    it('matches "can you do a checkup on my computer" to system_checkup', () => {
      const match = matchSkill('can you do a checkup on my computer');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('system_checkup');
    });

    it('matches "my wifi keeps disconnecting" to network_fix', () => {
      const match = matchSkill('my wifi keeps disconnecting');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('network_fix');
    });
  });

  describe('matchSkill — original skill routing', () => {
    it('matches "how do I copy and paste" to copy-paste', () => {
      const match = matchSkill('how do I copy and paste');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('copy-paste');
    });

    it('matches "how do I send an email" to send-email', () => {
      const match = matchSkill('how do I send an email');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('send-email');
    });

    it('matches "how do I take a screenshot" to screenshot', () => {
      const match = matchSkill('how do I take a screenshot');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('screenshot');
    });
  });

  describe('matchSkill — advanced Gmail skills', () => {
    it('matches "how do I check my inbox" to read-email', () => {
      const match = matchSkill('how do I check my inbox');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('read-email');
    });

    it('matches "any new emails for me" to read-email', () => {
      const match = matchSkill('any new emails for me');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('read-email');
    });

    it('matches "how do I reply to this email" to reply-forward', () => {
      const match = matchSkill('how do I reply to this email');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('reply-forward');
    });

    it('matches "I want to forward this email to my son" to reply-forward', () => {
      const match = matchSkill('I want to forward this email to my son');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('reply-forward');
    });

    it('matches "find an old email from my doctor" to search-email', () => {
      const match = matchSkill('find an old email from my doctor');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('search-email');
    });

    it('matches "how do I delete this email" to email-organize', () => {
      const match = matchSkill('how do I delete this email');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('email-organize');
    });

    it('matches "I want to archive this email" to email-organize', () => {
      const match = matchSkill('I want to archive this email');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('email-organize');
    });

    it('matches "how do I save a draft" to email-drafts', () => {
      const match = matchSkill('how do I save a draft');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('email-drafts');
    });

    it('matches "where is my unfinished email" to email-drafts', () => {
      const match = matchSkill('where is my unfinished email');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('email-drafts');
    });

    it('does NOT route "how do I send an email" to a new Gmail skill (regression check)', () => {
      const match = matchSkill('how do I send an email');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('send-email');
    });
  });

  describe('matchSkill — universal troubleshooter (catch-all)', () => {
    it('matches "I do not know what is wrong" to universal-troubleshooter', () => {
      const match = matchSkill("I don't know what's wrong");
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('universal-troubleshooter');
    });

    it('matches "please help me with my computer" to universal-troubleshooter', () => {
      const match = matchSkill('please help me with my computer');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('universal-troubleshooter');
    });

    it('matches "I am stuck and need help" to universal-troubleshooter', () => {
      const match = matchSkill("I'm stuck and I need your help");
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('universal-troubleshooter');
    });

    it('matches "can you walk me through this" to universal-troubleshooter', () => {
      const match = matchSkill('can you walk me through this');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('universal-troubleshooter');
    });

    it('matches "I am having trouble with my computer" to universal-troubleshooter', () => {
      const match = matchSkill("I'm having trouble with my computer");
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('universal-troubleshooter');
    });

    it('does NOT steal "something is wrong" from diagnose_system', () => {
      const match = matchSkill('something is wrong with my computer');
      expect(match).not.toBeNull();
      expect(match.skill.id).not.toBe('universal-troubleshooter');
      expect(match.skill.id).toBe('diagnose_system');
    });

    it('does NOT steal an "app not working" phrase from a more specific skill', () => {
      const match = matchSkill('my app is not working');
      expect(match).not.toBeNull();
      expect(match.skill.id).not.toBe('universal-troubleshooter');
    });

    it('does NOT steal a "wifi not working" phrase from a more specific skill', () => {
      const match = matchSkill('my wifi is not working');
      expect(match).not.toBeNull();
      expect(match.skill.id).not.toBe('universal-troubleshooter');
    });

    it('does NOT steal "check my computer" from system_checkup', () => {
      const match = matchSkill('can you check my computer');
      expect(match).not.toBeNull();
      expect(match.skill.id).not.toBe('universal-troubleshooter');
      expect(match.skill.id).toBe('system_checkup');
    });
  });

  describe('matchSkill — priority tie-breaking', () => {
    it('prioritizes critical skills (scam) over beginner skills on tie', () => {
      const match = matchSkill('is this email a scam');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('scam-check');
    });

    it('matches "someone called asking for gift cards" to scam', () => {
      const match = matchSkill('someone called asking for gift cards');
      expect(match).not.toBeNull();
      // Should match one of the scam skills
      expect(match.skill.category).toBe('security');
    });
  });

  describe('matchSkill — edge cases', () => {
    it('returns null for empty string', () => {
      expect(matchSkill('')).toBeNull();
    });

    it('returns null for null', () => {
      expect(matchSkill(null)).toBeNull();
    });

    it('returns null for unrelated input', () => {
      expect(matchSkill('what is the meaning of life')).toBeNull();
    });

    it('matching is case-insensitive', () => {
      const match = matchSkill('MY COMPUTER IS REALLY SLOW');
      expect(match).not.toBeNull();
      expect(match.skill.id).toBe('slow_computer');
    });

    it('returns score > 0 for all matches', () => {
      const match = matchSkill('computer crashed');
      expect(match).not.toBeNull();
      expect(match.score).toBeGreaterThan(0);
    });
  });

  describe('buildSkillPrompt', () => {
    it('returns a string containing the skill name and prompt', () => {
      const skills = getAllSkills();
      const skill = skills.find(s => s.id === 'slow_computer');
      const prompt = buildSkillPrompt(skill);
      expect(prompt).toContain('Fix a Slow Computer');
      expect(prompt.length).toBeGreaterThan(50);
    });

    it('diagnostic skill prompts reference diagnostic tools', () => {
      const skills = getAllSkills();
      const diagSkills = skills.filter(s => s.category === 'diagnostics');
      for (const skill of diagSkills) {
        const prompt = buildSkillPrompt(skill);
        const hasDiagTool = /get_system_info|check_network|list_running_apps|check_disk_health|check_installed_software|get_battery_status|read_error_log|take_screenshot/.test(prompt);
        expect(hasDiagTool).toBe(true);
      }
    });
  });

  describe('getSkillsSummary', () => {
    it('returns a multi-line summary of all skills', () => {
      const summary = getSkillsSummary();
      expect(typeof summary).toBe('string');
      expect(summary.split('\n').length).toBeGreaterThanOrEqual(24);
    });

    it('includes diagnostic skill names', () => {
      const summary = getSkillsSummary();
      expect(summary).toContain('Fix a Slow Computer');
      expect(summary).toContain('Diagnose Computer Problems');
      expect(summary).toContain('Computer Health Checkup');
    });
  });
});
