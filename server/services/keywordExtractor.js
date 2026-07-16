const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

// Expanded stopword list
const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','been','be','have','has','had',
  'do','does','did','will','would','could','should','may','might','must',
  'it','its','this','that','these','those','i','we','you','he','she','they',
  'my','our','your','his','her','their','which','who','what','when','where',
  'how','all','each','every','both','few','more','most','other','some',
  'such','no','not','only','own','same','than','too','very','just','also',
  'about','above','after','before','between','into','through','during',
  'including','without','within','along','following','across','behind',
  'beyond','plus','except','up','out','around','down','off','above','use',
  'used','using','can','need','make','making','made','work','working','get',
  'experience','years','year','strong','ability','knowledge','skills','skill',
  'excellent','good','great','team','company','business','role','position',
]);

// Important tech/domain keywords to prioritize
const TECH_PATTERNS = [
  // Languages
  /\b(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin|scala|r|matlab)\b/gi,
  // Frameworks
  /\b(react|angular|vue|node\.?js|express|django|flask|spring|laravel|rails|next\.?js|nuxt)\b/gi,
  // Cloud & DevOps
  /\b(aws|gcp|azure|docker|kubernetes|k8s|terraform|ansible|jenkins|gitlab|github|ci\/cd|devops)\b/gi,
  // Databases
  /\b(mongodb|postgres|postgresql|mysql|redis|elasticsearch|cassandra|dynamodb|sqlite|sql)\b/gi,
  // AI/ML
  /\b(machine learning|deep learning|tensorflow|pytorch|scikit-learn|nlp|llm|gpt|bert|ai|ml|data science)\b/gi,
  // General tech
  /\b(rest|graphql|api|microservices|agile|scrum|git|linux|bash|shell|html|css|sass|webpack|vite)\b/gi,
];

/**
 * Preprocess text: lowercase, remove punctuation, tokenize, remove stopwords
 */
function preprocess(text) {
  const lower = text.toLowerCase();
  const noPunct = lower.replace(/[^a-z0-9\s\+#\.\/]/g, ' ');
  const tokens = tokenizer.tokenize(noPunct);
  return tokens.filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Extract tech/domain keywords using pattern matching + token frequency
 */
function extractKeywords(text) {
  const keywords = new Set();

  // 1. Pattern-based tech keyword extraction (high precision)
  for (const pattern of TECH_PATTERNS) {
    const matches = text.match(pattern) || [];
    matches.forEach((m) => keywords.add(m.toLowerCase().replace(/\s+/g, ' ').trim()));
  }

  // 2. Token frequency for non-tech terms (top meaningful tokens)
  const tokens = preprocess(text);
  const freq = {};
  for (const token of tokens) {
    if (token.length >= 3) {
      freq[token] = (freq[token] || 0) + 1;
    }
  }

  // Add tokens that appear at least twice and aren't already captured
  Object.entries(freq)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .forEach(([word]) => keywords.add(word));

  return [...keywords];
}

module.exports = { preprocess, extractKeywords };
