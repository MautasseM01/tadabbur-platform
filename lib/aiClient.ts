export const AI_MODEL_STORAGE_KEY = 'tadabbur_ai_model_v1';

export interface SelectedAIModel {
  provider: string;
  model: string;
}

export const DEFAULT_AI_MODEL: SelectedAIModel = {
  provider: 'local',
  model: 'local-lexicon',
};

export function getSelectedAIModel(): SelectedAIModel {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(AI_MODEL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.provider === 'string' && typeof parsed.model === 'string') {
          return { provider: parsed.provider, model: parsed.model };
        }
      }
    } catch {
      // ignore
    }
  }
  return DEFAULT_AI_MODEL;
}

export function setSelectedAIModel(provider: string, model: string) {
  try {
    localStorage.setItem(AI_MODEL_STORAGE_KEY, JSON.stringify({ provider, model }));
  } catch {
    // ignore
  }
}
