/*
  SEGMENT resource library.

  To add a resource:
    1. Put the PDF in resources/pdfs/ (and optionally a cover image in resources/thumbs/).
    2. Add an entry below. Omit `file` to show it as "Coming soon".

  category: "provider" | "patient" | "research" | "presentation"
  partner (optional): "unc" | "ggc" | "emory" — tints the card with that partner's colour.
  Tip: macOS can make a cover image from a PDF's first page:
    sips -s format jpeg -Z 640 resources/pdfs/NAME.pdf --out resources/thumbs/NAME.jpg
*/
window.SEGMENT_RESOURCES = [
  {
    title: "Genetics eConsults: A guide for South Carolina healthcare providers",
    source: "Greenwood Genetic Center",
    partner: "ggc",
    category: "provider",
    description:
      "What a genetics eConsult is, why to request one, how to submit through the GGC Provider Portal, best practices, eConsults vs. referrals, and FAQs.",
    file: "resources/pdfs/ggc-genetics-econsults-provider-guide.pdf",
    thumb: "resources/thumbs/ggc-genetics-econsults-provider-guide.jpg",
    pages: 5,
    size: "2.2 MB",
    updated: "2026",
  },
  {
    title: "Genetics eConsults at UNC Health: A guide for North Carolina providers",
    source: "UNC Health",
    partner: "unc",
    category: "provider",
    description: "How North Carolina clinicians request a genetics eConsult from UNC Health, with tips for a successful consult.",
    placeholder: true,
  },
  {
    title: "Genetics eConsults at Emory Healthcare: A guide for Georgia providers",
    source: "Emory Healthcare",
    partner: "emory",
    category: "provider",
    description: "How Georgia clinicians request a genetics eConsult from Emory Healthcare.",
    placeholder: true,
  },
  {
    title: "SEGMENT quick-reference card",
    source: "SEGMENT",
    category: "provider",
    description: "One page covering when to request an eConsult, what to include, and where to submit in NC, SC, and GA.",
    placeholder: true,
  },
  {
    title: "What is a genetics eConsult? A handout for patients and families",
    source: "SEGMENT",
    category: "patient",
    description: "Plain-language explainer clinicians can share with patients when they request an eConsult on their behalf.",
    placeholder: true,
  },
  {
    title: "SEGMENT project overview",
    source: "SEGMENT",
    category: "research",
    description: "Two-page summary of the network, its research aims, and NHGRI funding (U01HG014142).",
    placeholder: true,
  },
  {
    title: "Introducing SEGMENT: network launch webinar slides",
    source: "SEGMENT",
    category: "presentation",
    description: "Slides from the network launch, covering the eConsult workflow, partner sites, and evaluation plan.",
    placeholder: true,
  },
];
