#!/usr/bin/env python3
"""Fix webhook.ts TypeScript errors"""

import re

# Read the file
with open('server/webhook.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for enhanceLyrics after other imports
content = content.replace(
    'import { getSunoTaskDetails } from "./suno";',
    'import { getSunoTaskDetails } from "./suno";\nimport { enhanceLyrics } from "./_core/gemini";'
)

# 2. Remove images from destructuring (line 269)
content = content.replace(
    'const { callbackType, task_id, data: musicData, images } = data;',
    'const { callbackType, task_id, data: musicData } = data;'
)

# 3. Remove the entire images processing block (lines 291-332)
# Find and remove: if (Array.isArray(images) && images.length > 0) { ... }
pattern = r'\s*\/\/ 1\) Callback de CAPA \(images\)[\s\S]*?}\s*\/\/ 2\) Callback de M'
replacement = '    // Callback de M'
content = re.sub(pattern, replacement, content)

# 4. Fix occasion and mood null types
content = content.replace(
    '                occasion: lead.occasion,',
    '                occasion: lead.occasion || undefined,'
)
content = content.replace(
    '                mood: lead.mood,',
    '                mood: lead.mood || undefined,'
)

# 5. Fix email and slug null types
content = content.replace(
    'queueMusicReadyEmail(lead.email, jobId, firstSong.shareSlug, firstSong.title)',
    "queueMusicReadyEmail(lead.email || '', jobId, firstSong.shareSlug || '', firstSong.title || 'Sua Música')"
)

# Write the file
with open('server/webhook.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ webhook.ts fixed")
