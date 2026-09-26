# Rule 22: Open Source & Design System Integrations

## 1. UI and Design Systems
The system's UI must not reinvent the wheel for basic components. It should draw inspiration from, or directly utilize, established open-source design systems and UI tools to ensure a premium, accessible, and robust user experience.
Approved references and design tokens include:
- **Major Design Systems:** Material Design 3 (M3), Gestalt (Pinterest), Blueprint (Palantir), Polaris (Shopify), Lightning (Salesforce), Primer (GitHub), React Spectrum (Adobe), Ring UI (JetBrains), Base Web (Uber), Atlassian Design, Backpack (Skyscanner), Fluent UI (Microsoft), Protocol (Mozilla), Carbon (IBM).
- **Design Tools:** Penpot, Open Design, Awesome-Design-Tools.
- **UI Enhancements:** Lenis (smooth scrolling).

## 2. Browser Automation and Agentic Tooling
For tasks requiring scraping or intelligent web interactions (e.g., Job Intelligence, Tech Intelligence), the system should utilize modern open-source automation libraries:
- **Playwright** (microsoft/playwright) for robust end-to-end testing and scraping.
- **Browser-Use** (browser-use/browser-use) or **OmniRoute** (diegosouzapw/OmniRoute) for agent-driven web navigation if simple APIs are insufficient.

## 3. AI and Image Generation
The system should leverage or integrate with the following open-source ecosystems for asset generation:
- **ComfyUI** (Comfy-Org/ComfyUI) for node-based image generation pipelines.
- **Diffusers** (huggingface/diffusers) and related tools for image generation and upscaling.
- Utilize curated lists for APIs: Awesome-AI-Image-Generation-API, Awesome-Image-Generation, etc.

## 4. Development Philosophy
Before building a custom solution for styling, scraping, or generation, check if one of the approved open-source repositories provides a solid foundation. The architecture should wrap these tools in our defined provider abstractions (Rule 01) to ensure the core logic remains independent of the specific underlying tool.
