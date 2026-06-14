import pptxgen from "pptxgenjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "HMD Secure AI-Native CRM";
pptx.subject = "Technical architecture and AI capabilities";
pptx.title = "HMD Secure AI-Native CRM";
pptx.company = "Hackathon prototype";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Noto Sans",
  bodyFontFace: "Noto Sans",
  lang: "en-US",
};

const C = {
  field: "050505",
  surface: "171717",
  ink: "FFFFFF",
  muted: "C9C9C9",
  cyan: "00A4EF",
  blue: "0078D7",
  green: "00B294",
  lime: "BAD80A",
  magenta: "E3008C",
  orange: "F7630C",
};

function baseSlide(title: string, section: string) {
  const slide = pptx.addSlide();
  slide.background = { color: C.field };
  slide.addText(section, {
    x: 0.62, y: 0.34, w: 3.2, h: 0.3,
    fontFace: "Noto Sans", fontSize: 11,
    color: C.muted, margin: 0,
  });
  slide.addText(title, {
    x: 0.58, y: 0.63, w: 12.1, h: 0.72,
    fontFace: "Noto Sans", fontSize: 34, bold: false,
    color: C.ink, margin: 0,
  });
  slide.addText("HMD Secure AI-Native CRM · Hackathon prototype", {
    x: 0.62, y: 7.12, w: 5.8, h: 0.18,
    fontSize: 7.5, color: "8A8A8A", margin: 0,
  });
  return slide;
}

function tile(
  slide: pptxgen.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  body: string,
  options: { fill?: string; titleSize?: number; bodySize?: number; darkText?: boolean } = {},
) {
  const textColor = options.darkText ? C.field : C.ink;
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h,
    fill: { color: options.fill ?? C.surface },
    line: { color: options.fill ?? C.surface, transparency: 100 },
  });
  slide.addText(title, {
    x: x + 0.2, y: y + 0.18, w: w - 0.4, h: 0.35,
    fontFace: "Noto Sans", fontSize: options.titleSize ?? 15,
    bold: false, color: textColor, margin: 0,
  });
  slide.addText(body, {
    x: x + 0.2, y: y + 0.64, w: w - 0.4, h: h - 0.78,
    fontFace: "Noto Sans", fontSize: options.bodySize ?? 9.5,
    color: options.darkText ? "242424" : "E7E7E7",
    valign: "top", margin: 0,
  });
}

function arrow(slide: pptxgen.Slide, x: number, y: number, w: number) {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h: 0,
    line: { color: C.ink, transparency: 25, width: 1.25, beginArrowType: "none", endArrowType: "triangle" },
  });
}

{
  const slide = baseSlide("Technical architecture", "system view");
  slide.addText("One deployable CRM, one shared data model, one evidence-grounded AI path.", {
    x: 0.62, y: 1.45, w: 8.7, h: 0.3,
    fontSize: 11.5, color: C.muted, margin: 0,
  });

  tile(slide, 0.62, 2.0, 2.25, 1.38, "people", "Sales · TAM\nSales Manager · Finance", { fill: C.magenta });
  tile(slide, 3.12, 2.0, 2.55, 1.38, "web application", "Astro + React\nBun runtime · responsive UI", { fill: C.cyan });
  tile(slide, 5.92, 2.0, 2.55, 1.38, "CRM API", "Hono routes · auth / RBAC\nAccounts · deals · cases · offers", { fill: C.blue });
  tile(slide, 8.72, 2.0, 2.55, 1.38, "data layer", "Drizzle ORM\nPostgreSQL system of record", { fill: C.green });
  arrow(slide, 2.9, 2.69, 0.18);
  arrow(slide, 5.7, 2.69, 0.18);
  arrow(slide, 8.5, 2.69, 0.18);

  slide.addText("Azure production platform", {
    x: 0.62, y: 3.72, w: 3.2, h: 0.3,
    fontSize: 12, color: C.ink, margin: 0,
  });
  tile(slide, 0.62, 4.1, 3.55, 1.12, "Container Apps", "Runs the containerized Bun / Astro application", { fill: C.blue });
  tile(slide, 4.31, 4.1, 3.55, 1.12, "Container Registry", "Stores versioned application images", { fill: C.blue });
  tile(slide, 8.0, 4.1, 3.55, 1.12, "Azure PostgreSQL", "Flexible Server with seeded CRM data", { fill: C.blue });

  tile(slide, 0.62, 5.52, 3.55, 1.12, "MCP integration", "Compatible AI clients · governed CRM tools", { fill: C.green });
  tile(slide, 4.31, 5.52, 3.55, 1.12, "assistant gateway", "Hermes / OpenClaw-compatible endpoint", { fill: C.cyan });
  tile(slide, 8.0, 5.52, 3.55, 1.12, "research tools", "Public web evidence · visible source URLs", { fill: C.orange });
}

{
  const slide = baseSlide("AI features", "capability map");
  slide.addText("AI acts as an analyst beside the records: grounded, reviewable, and explicit about uncertainty.", {
    x: 0.62, y: 1.45, w: 10.7, h: 0.3,
    fontSize: 11.5, color: C.muted, margin: 0,
  });

  tile(slide, 0.62, 2.0, 4.05, 1.62, "ask the CRM", "Questions across accounts, contacts, deals, cases, offers, activities and forecasts.\nPersistent threads · file attachments", { fill: C.cyan });
  tile(slide, 4.82, 2.0, 3.15, 1.62, "evidence-backed research", "CRM snapshot + public web research.\nVisible sources and uncertainty.", { fill: C.blue });
  tile(slide, 8.12, 2.0, 3.43, 1.62, "AI from any client", "MCP lets compatible assistants search data and perform governed record actions.", { fill: C.green });

  slide.addText("structured insights", {
    x: 0.62, y: 3.92, w: 2.4, h: 0.3,
    fontSize: 12, color: C.ink, margin: 0,
  });
  tile(slide, 0.62, 4.28, 2.55, 1.45, "account enrichment", "Company context and relevant account signals", { fill: C.magenta });
  tile(slide, 3.32, 4.28, 2.55, 1.45, "next best action", "Recommended follow-up with editable email draft", { fill: C.green });
  tile(slide, 6.02, 4.28, 2.55, 1.45, "risk detection", "Stale deals · overdue closes · SLA pressure · blockers", { fill: C.orange });
  tile(slide, 8.72, 4.28, 2.83, 1.45, "pipeline intelligence", "Pipeline summaries and natural-language forecast narrative", { fill: C.lime, darkText: true });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.62, y: 6.03, w: 10.93, h: 0.66,
    fill: { color: C.surface },
    line: { color: C.surface, transparency: 100 },
  });
  slide.addText([
    { text: "AI with receipts  ", options: { color: C.cyan } },
    { text: "Evidence + confidence + accept/dismiss review. No silent changes to stages, forecasts, approvals or customer data.", options: { color: C.ink } },
  ], {
    x: 0.84, y: 6.23, w: 10.48, h: 0.22,
    fontSize: 10, margin: 0,
  });
}

await Bun.write("slides/.gitkeep", "");
await pptx.writeFile({ fileName: "slides/hmd-secure-architecture-ai.pptx" });
