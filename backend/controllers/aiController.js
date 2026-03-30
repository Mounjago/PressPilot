const winston = require('winston');
const User = require('../models/User');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'presspilot-ai' },
  transports: [new winston.transports.Console()]
});

/**
 * AI Controller for PressPilot
 * Multi-provider support: OpenAI, Anthropic (Claude), Google Gemini
 */

// Default models per provider
const DEFAULT_MODELS = {
  openai: 'gpt-4',
  anthropic: 'claude-sonnet-4-20250514',
  gemini: 'gemini-pro'
};

// Provider API endpoints
const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models'
};

/**
 * Get the AI API key for a user (user's own key or fallback to server env)
 */
async function getApiKeyForUser(user, provider) {
  // Try user's own key first
  if (user.aiSettings?.apiKey) {
    try {
      return user.getDecryptedAiApiKey();
    } catch (err) {
      logger.warn('Failed to decrypt user AI API key', { userId: user._id, error: err.message });
    }
  }
  // Fallback to server-level env vars
  const envKeys = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };
  return envKeys[provider] || null;
}

/**
 * Build the press release prompt
 */
function buildPrompt(subject) {
  return `Tu es un expert en relations presse. Rédige un communiqué de presse professionnel et percutant à destination des journalistes.

Le communiqué doit inclure :
- Un titre clair et accrocheur
- Un chapeau (résumé de 2 phrases)
- Un corps structuré avec paragraphes informatifs
- Des citations humaines si pertinent
- Un encart "Infos clés" si nécessaire
- Un appel à action ou à contact à la fin

Sujet du communiqué : "${subject.replace(/"/g, '\\"')}"

Reste sobre, concis, orienté presse écrite. Langue : français.`;
}

/**
 * Call OpenAI Chat Completions API
 */
async function callOpenAI(apiKey, model, prompt) {
  const response = await fetch(PROVIDER_ENDPOINTS.openai, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.openai,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || `OpenAI API error ${response.status}`);
    error.status = response.status;
    error.provider = 'openai';
    throw error;
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
      totalTokens: data.usage?.total_tokens
    }
  };
}

/**
 * Call Anthropic Messages API
 */
async function callAnthropic(apiKey, model, prompt) {
  const response = await fetch(PROVIDER_ENDPOINTS.anthropic, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODELS.anthropic,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || `Anthropic API error ${response.status}`);
    error.status = response.status;
    error.provider = 'anthropic';
    throw error;
  }

  const data = await response.json();
  const textBlock = data.content?.find(b => b.type === 'text');
  return {
    content: textBlock?.text || '',
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens,
      totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

/**
 * Call Google Gemini API
 */
async function callGemini(apiKey, model, prompt) {
  const modelName = model || DEFAULT_MODELS.gemini;
  const url = `${PROVIDER_ENDPOINTS.gemini}/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error?.message || `Gemini API error ${response.status}`);
    error.status = response.status;
    error.provider = 'gemini';
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return {
    content: text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount,
      completionTokens: data.usageMetadata?.candidatesTokenCount,
      totalTokens: data.usageMetadata?.totalTokenCount
    }
  };
}

/**
 * Dispatch to the correct provider
 */
async function callProvider(provider, apiKey, model, prompt) {
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, prompt);
    case 'anthropic':
      return callAnthropic(apiKey, model, prompt);
    case 'gemini':
      return callGemini(apiKey, model, prompt);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// ============================================================
// Route Handlers
// ============================================================

/**
 * Generate a press release using the user's configured AI provider
 * @route POST /api/ai/generate-press-release
 * @body {subject}
 * @access Private
 */
const generatePressRelease = async (req, res) => {
  try {
    const { subject } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required and must be a non-empty string'
      });
    }

    if (subject.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Subject must be 2000 characters or less'
      });
    }

    // Load user with AI settings
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const provider = user.aiSettings?.provider || 'anthropic';
    const model = user.aiSettings?.model || DEFAULT_MODELS[provider];
    const apiKey = await getApiKeyForUser(user, provider);

    if (!apiKey) {
      logger.warn('AI API key not configured', { userId: req.user.id, provider });
      return res.status(503).json({
        success: false,
        message: `Clé API ${provider} non configurée. Rendez-vous dans Paramètres > IA pour configurer votre clé.`
      });
    }

    const prompt = buildPrompt(subject);
    const result = await callProvider(provider, apiKey, model, prompt);

    if (!result.content) {
      return res.status(502).json({
        success: false,
        message: 'AI service returned an empty response'
      });
    }

    logger.info('Press release generated', {
      userId: req.user.id,
      provider,
      model,
      subjectLength: subject.length,
      responseTokens: result.usage?.totalTokens
    });

    return res.json({
      success: true,
      data: {
        content: result.content,
        provider,
        model,
        usage: result.usage
      }
    });

  } catch (error) {
    logger.error('Generate press release error', { error: error.message, stack: error.stack });

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'AI service rate limit reached. Please try again later.'
      });
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
      return res.status(502).json({
        success: false,
        message: 'AI service is temporarily unreachable'
      });
    }

    if (error.status === 401 || error.status === 403) {
      return res.status(502).json({
        success: false,
        message: 'Clé API invalide. Vérifiez votre configuration dans Paramètres > IA.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error generating press release'
    });
  }
};

/**
 * Get AI settings for the current user
 * @route GET /api/ai/settings
 * @access Private
 */
const getAiSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const settings = {
      provider: user.aiSettings?.provider || 'anthropic',
      model: user.aiSettings?.model || null,
      hasApiKey: !!(user.aiSettings?.apiKey),
      // Mask the API key for display
      apiKeyPreview: null
    };

    // Show masked preview if key exists
    if (user.aiSettings?.apiKey) {
      try {
        const decrypted = user.getDecryptedAiApiKey();
        if (decrypted && decrypted.length > 8) {
          settings.apiKeyPreview = decrypted.substring(0, 4) + '****' + decrypted.substring(decrypted.length - 4);
        } else if (decrypted) {
          settings.apiKeyPreview = '****';
        }
      } catch (err) {
        logger.warn('Failed to decrypt AI API key for preview', { userId: req.user.id });
        settings.apiKeyPreview = '****';
      }
    }

    // Add available models per provider for frontend reference
    settings.availableModels = {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
      gemini: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash']
    };

    settings.defaultModels = DEFAULT_MODELS;

    return res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Get AI settings error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error fetching AI settings' });
  }
};

/**
 * Update AI settings for the current user
 * @route PUT /api/ai/settings
 * @body {provider, apiKey?, model?}
 * @access Private
 */
const updateAiSettings = async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Initialize aiSettings if not present
    if (!user.aiSettings) {
      user.aiSettings = {};
    }

    // Update provider
    user.aiSettings.provider = provider;

    // Update model (null = use default)
    user.aiSettings.model = model || null;

    // Update API key only if explicitly provided (not undefined)
    // Empty string = clear the key, undefined = keep existing
    if (apiKey !== undefined) {
      if (apiKey === '' || apiKey === null) {
        user.aiSettings.apiKey = null;
      } else {
        user.aiSettings.apiKey = apiKey; // Will be encrypted by pre-save hook
      }
    }

    await user.save();

    logger.info('AI settings updated', { userId: req.user.id, provider, model: model || 'default' });

    return res.json({
      success: true,
      message: 'Paramètres IA mis à jour avec succès',
      data: {
        provider: user.aiSettings.provider,
        model: user.aiSettings.model,
        hasApiKey: !!(user.aiSettings.apiKey)
      }
    });
  } catch (error) {
    logger.error('Update AI settings error', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error updating AI settings' });
  }
};

/**
 * Test the AI connection with the user's configured provider and key
 * @route POST /api/ai/test-connection
 * @access Private
 */
const testAiConnection = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const provider = user.aiSettings?.provider || 'anthropic';
    const model = user.aiSettings?.model || DEFAULT_MODELS[provider];
    const apiKey = await getApiKeyForUser(user, provider);

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: `Aucune clé API configurée pour ${provider}. Ajoutez votre clé dans les paramètres.`
      });
    }

    // Send a minimal test prompt
    const testPrompt = 'Réponds uniquement "OK" pour confirmer que la connexion fonctionne.';
    const startTime = Date.now();
    const result = await callProvider(provider, apiKey, model, testPrompt);
    const latency = Date.now() - startTime;

    logger.info('AI connection test successful', { userId: req.user.id, provider, model, latency });

    return res.json({
      success: true,
      message: `Connexion à ${provider} réussie`,
      data: {
        provider,
        model,
        latencyMs: latency,
        response: result.content?.substring(0, 100)
      }
    });
  } catch (error) {
    logger.error('AI connection test failed', { error: error.message, provider: error.provider });

    let message = `Échec de connexion à ${error.provider || 'AI'}`;
    if (error.status === 401 || error.status === 403) {
      message = 'Clé API invalide ou expirée';
    } else if (error.status === 429) {
      message = 'Limite de requêtes atteinte, réessayez plus tard';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      message = 'Service IA injoignable';
    }

    return res.status(400).json({
      success: false,
      message,
      error: error.message
    });
  }
};

module.exports = {
  generatePressRelease,
  getAiSettings,
  updateAiSettings,
  testAiConnection
};
