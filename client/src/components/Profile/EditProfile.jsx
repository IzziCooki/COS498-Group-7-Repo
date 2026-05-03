import React, { useState, useCallback } from 'react';
import FullScreenOverlay from '../Overlays/FullScreenOverlay';
import { useToast } from '../../hooks/useToast';
import './EditProfile.css';

/**
 * EditProfile — Full-screen overlay to edit user profile fields.
 * Fields: name, device (Mac/Windows), comfort level (4 emoji tiles),
 * goal (textarea), AI model (select dropdown).
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   user: object,
 *   updateProfile: (fields: object) => Promise<object>,
 * }} props
 */

const DEVICES = [
  { value: 'mac',     icon: '\uD83D\uDCBB', label: 'Mac' },
  { value: 'windows', icon: '\uD83D\uDDA5\uFE0F', label: 'Windows' },
];

const COMFORT_LEVELS = [
  { value: 'just-learning', icon: '\uD83C\uDF31', label: 'Just learning' },
  { value: 'some-basics',   icon: '\uD83C\uDF3F', label: 'Some basics' },
  { value: 'comfortable',   icon: '\uD83C\uDF33', label: 'Comfortable' },
  { value: 'confident',     icon: '\uD83C\uDF32', label: 'Confident' },
];

const AI_MODELS = [
  { value: 'default', label: 'Default (recommended)' },
  { value: 'claude-sonnet', label: 'Claude Sonnet' },
  { value: 'claude-haiku', label: 'Claude Haiku (faster)' },
];

function EditProfile({ open, onClose, user, updateProfile }) {
  const [name, setName] = useState(user?.name || user?.display_name || '');
  const [device, setDevice] = useState(user?.device || user?.platform || 'mac');
  const [comfort, setComfort] = useState(user?.comfort_level || user?.comfort || 'just-learning');
  const [goal, setGoal] = useState(user?.goal || '');
  const [model, setModel] = useState(user?.ai_model || user?.model || 'default');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast() || {};

  // Reset form when user changes or overlay opens
  const resetForm = useCallback(() => {
    setName(user?.name || user?.display_name || '');
    setDevice(user?.device || user?.platform || 'mac');
    setComfort(user?.comfort_level || user?.comfort || 'just-learning');
    setGoal(user?.goal || '');
    setModel(user?.ai_model || user?.model || 'default');
    setError(null);
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: name.trim(),
        device,
        comfort_level: comfort,
        goal: goal.trim(),
        ai_model: model,
      });
      toast?.({ kind: 'success', text: 'Profile updated!' });
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [name, device, comfort, goal, model, updateProfile, onClose, toast]);

  const handleCancel = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <FullScreenOverlay
      open={open}
      onClose={handleCancel}
      title="Edit your details"
      backLabel="Cancel"
      labelledBy="pcp-edit-profile-title"
    >
      <div className="pcp-edit-profile" role="form" aria-label="Edit your profile">
        {/* Error */}
        {error && (
          <div className="pcp-edit-profile__error" role="alert">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="pcp-edit-profile__field">
          <label htmlFor="pcp-edit-name" className="pcp-edit-profile__label">
            Your name
          </label>
          <input
            id="pcp-edit-name"
            className="pcp-edit-profile__input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoComplete="name"
            aria-required="true"
          />
        </div>

        {/* Device */}
        <fieldset className="pcp-edit-profile__field">
          <legend className="pcp-edit-profile__label">Your computer</legend>
          <span className="pcp-edit-profile__hint">Which type of computer do you use?</span>
          <div className="pcp-edit-profile__tiles" role="radiogroup" aria-label="Computer type">
            {DEVICES.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={device === d.value}
                className={`pcp-edit-profile__tile${device === d.value ? ' pcp-edit-profile__tile--selected' : ''}`}
                onClick={() => setDevice(d.value)}
              >
                <span className="pcp-edit-profile__tile-icon" aria-hidden="true">
                  {d.icon}
                </span>
                <span className="pcp-edit-profile__tile-label">{d.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Comfort level */}
        <fieldset className="pcp-edit-profile__field">
          <legend className="pcp-edit-profile__label">Comfort with computers</legend>
          <span className="pcp-edit-profile__hint">How comfortable are you with computers?</span>
          <div className="pcp-edit-profile__tiles" role="radiogroup" aria-label="Comfort level">
            {COMFORT_LEVELS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={comfort === c.value}
                className={`pcp-edit-profile__tile${comfort === c.value ? ' pcp-edit-profile__tile--selected' : ''}`}
                onClick={() => setComfort(c.value)}
              >
                <span className="pcp-edit-profile__tile-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <span className="pcp-edit-profile__tile-label">{c.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Goal */}
        <div className="pcp-edit-profile__field">
          <label htmlFor="pcp-edit-goal" className="pcp-edit-profile__label">
            What do you want to learn?
          </label>
          <span className="pcp-edit-profile__hint">
            Tell PC Pal what you would like to get better at.
          </span>
          <textarea
            id="pcp-edit-goal"
            className="pcp-edit-profile__textarea"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. I want to learn how to video call my grandchildren"
            rows={3}
          />
        </div>

        {/* AI Model */}
        <div className="pcp-edit-profile__field">
          <label htmlFor="pcp-edit-model" className="pcp-edit-profile__label">
            AI model
          </label>
          <span className="pcp-edit-profile__hint">
            Choose which AI helps you. The default works great for most people.
          </span>
          <select
            id="pcp-edit-model"
            className="pcp-edit-profile__select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {AI_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="pcp-edit-profile__actions">
          <button
            className="pcp-edit-profile__save"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save changes"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            className="pcp-edit-profile__cancel"
            type="button"
            onClick={handleCancel}
            aria-label="Cancel editing"
          >
            Cancel
          </button>
        </div>
      </div>
    </FullScreenOverlay>
  );
}

export default EditProfile;
