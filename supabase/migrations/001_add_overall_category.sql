-- Adds an 'overall' category so a single per-executive verdict score
-- (from the one-shot Gemini pipeline) can be stored without forcing
-- it into the 7 topic-specific categories it wasn't designed for.
alter type score_category add value if not exists 'overall';
