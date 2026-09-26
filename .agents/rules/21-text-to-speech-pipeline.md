# Rule 21: Text-to-Speech (TTS) Pipeline

## 1. Scope and Integration
The content generation pipeline must support Text-to-Speech (TTS) capabilities. The goal is to generate high-quality audio versions of generated content (e.g., voice notes, podcast-like snippets) alongside text and image assets.

## 2. Approved Open-Source TTS Tooling
When implementing TTS, the system must prioritize leveraging robust open-source projects or APIs modeled after them. Approved reference models and tools include:
- **Kokoro** (hexgrad/kokoro, hexgrad/Kokoro-82M)
- **Piper** (rhasspy/piper)
- **Coqui AI TTS** (idiap/coqui-ai-TTS)
- **F5-TTS** (SWivid/F5-TTS)
- **GPT-SoVITS** (RVC-Boss/GPT-SoVITS)
- **NVIDIA NeMo Speech** (NVIDIA-NeMo/Speech)
- **OmniVoice** (k2-fsa/OmniVoice)

## 3. Implementation Requirements
- **Modularity:** The TTS generation step must be abstracted behind an interface (`TTSProvider`), allowing the system to swap models or switch to third-party APIs without breaking core logic.
- **Cost vs. Quality:** The decision engine should evaluate when TTS is appropriate for a post. If running locally or on self-hosted infrastructure, hardware constraints (e.g., lack of GPU on standard Vercel edge/hobby tiers) must be accounted for. For hobby-tier execution, TTS generation should likely be delegated to an external, cost-controlled API endpoint.
- **Storage:** Generated audio assets must be treated as ephemeral until a post is published, similar to images. They should be stored in temporary buckets/storage with cleanup policies.
