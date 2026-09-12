export type AssetCategory = "sacred" | "characters" | "vignettes" | "stickers";

export type ElementPlacement =
  | "float-left"
  | "float-right"
  | "dual-opposite"
  | "corner-top-left"
  | "corner-top-right"
  | "custom";

export type ElementEnterAnimation =
  | "none"
  | "float-in-left"
  | "float-in-right"
  | "float-in-bottom"
  | "fade-scale"
  | "spin-in";

export type ElementIdleAnimation =
  | "none"
  | "subtle-wavy"
  | "gentle-pulse"
  | "floating-bob"
  | "slow-spin"
  | "sway-pendulum"
  | "shimmer-shine";

export interface AssetItem {
  id: string;
  name: string;
  category: AssetCategory;
  assetPath: string;
  description: string;
  recommendedEnter?: ElementEnterAnimation;
  recommendedIdle?: ElementIdleAnimation;
}

export interface BannerElement {
  id: string;
  assetId: string;
  label?: string;
  category?: AssetCategory;
  placement: ElementPlacement;
  customPosition?: {
    x: number; // 0% to 100%
    y: number; // 0% to 100%
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  layer?: "background" | "foreground";
  opacity?: number;
  enterAnimation?: ElementEnterAnimation;
  idleAnimation?: ElementIdleAnimation;
  animationDuration?: number;
  animationDelay?: number;
}

export const ASSET_REGISTRY: AssetItem[] = [
  // 1. SACRED MOTIFS
  {
    id: "conch",
    name: "Sacred Shankha",
    category: "sacred",
    assetPath: "/assets/motifs/conch.webp",
    description: "Auspicious blowing conch shell for festival inaugurations.",
    recommendedEnter: "float-in-left",
    recommendedIdle: "floating-bob",
  },
  {
    id: "chakra",
    name: "Sudarshana Chakra",
    category: "sacred",
    assetPath: "/assets/motifs/chakra.webp",
    description: "Radiant multi-blade divine disc of Sri Vishnu / Sri Krishna.",
    recommendedEnter: "float-in-right",
    recommendedIdle: "slow-spin",
  },
  {
    id: "peacock_feather",
    name: "Mayur Pankh",
    category: "sacred",
    assetPath: "/assets/motifs/peacock-feather.webp",
    description: "Vibrant peacock feather with delicate barbs and sacred eye.",
    recommendedEnter: "float-in-bottom",
    recommendedIdle: "subtle-wavy",
  },
  {
    id: "flute",
    name: "Divine Venu / Flute",
    category: "sacred",
    assetPath: "/assets/motifs/flute.webp",
    description: "Golden bansuri with colorful silk tassels.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "subtle-wavy",
  },
  {
    id: "diya",
    name: "Aarti Diya",
    category: "sacred",
    assetPath: "/assets/motifs/diya.webp",
    description: "Glowing ghee lamp with warm flame for Kartik & Deepotsava.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "lotus",
    name: "Divine Lotus",
    category: "sacred",
    assetPath: "/assets/motifs/lotus.webp",
    description:
      "Padmasana lotus blossom representing purity and divine grace.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "tilak",
    name: "Vaishnava Tilak",
    category: "sacred",
    assetPath: "/assets/motifs/tilak.webp",
    description: "Sacred Urdhva Pundra with Tulasi leaf mark.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "shimmer-shine",
  },
  {
    id: "mridanga",
    name: "Kirtan Mridanga",
    category: "sacred",
    assetPath: "/assets/motifs/mridanga.webp",
    description: "Traditional terracotta drum for Harinama announcements.",
    recommendedEnter: "float-in-left",
    recommendedIdle: "floating-bob",
  },
  {
    id: "kartals",
    name: "Brass Kartals",
    category: "sacred",
    assetPath: "/assets/motifs/kartals.webp",
    description: "Auspicious hand cymbals with red silk ribbons.",
    recommendedEnter: "float-in-right",
    recommendedIdle: "sway-pendulum",
  },
  {
    id: "kalasha",
    name: "Purna Kalasha",
    category: "sacred",
    assetPath: "/assets/motifs/kalasha.webp",
    description: "Brass sacred urn with coconut and mango leaves.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "tulasi",
    name: "Tulasi Devi",
    category: "sacred",
    assetPath: "/assets/motifs/tulasi.webp",
    description: "Sacred Tulasi plant with delicate manjaris.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "subtle-wavy",
  },
  {
    id: "gita",
    name: "Bhagavad Gita",
    category: "sacred",
    assetPath: "/assets/motifs/gita.webp",
    description: "Sacred scripture on wooden Vyasasana stand.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "shimmer-shine",
  },

  // 2. MONKS & CHARACTERS
  {
    id: "monk_kirtan",
    name: "Harinama Monk",
    category: "characters",
    assetPath: "/assets/characters/monk-kirtan.svg",
    description: "Joyful sadhu dancing with upraised arms chanting Haribol.",
    recommendedEnter: "float-in-left",
    recommendedIdle: "floating-bob",
  },
  {
    id: "monk_mridanga",
    name: "Mridanga Devotee",
    category: "characters",
    assetPath: "/assets/characters/monk-mridanga.svg",
    description: "Devotee joyfully playing mridanga in sankirtan procession.",
    recommendedEnter: "float-in-left",
    recommendedIdle: "sway-pendulum",
  },
  {
    id: "monk_pranama",
    name: "Sadhu Pranama",
    category: "characters",
    assetPath: "/assets/characters/monk-pranama.svg",
    description: "Humble sadhu in folded-hand prayer greeting (Anjali Mudra).",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "monk_reading",
    name: "Scripture Student",
    category: "characters",
    assetPath: "/assets/characters/monk-reading.svg",
    description: "Seated devotee absorbed in reading Bhagavad-gita.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "surabhi_cow",
    name: "Surabhi Gomata",
    category: "characters",
    assetPath: "/assets/characters/surabhi-cow.svg",
    description: "Sacred cow with flower garland and golden horn tips.",
    recommendedEnter: "float-in-right",
    recommendedIdle: "floating-bob",
  },
  {
    id: "vrindavan_peacock",
    name: "Vrindavan Peacock",
    category: "characters",
    assetPath: "/assets/characters/vrindavan-peacock.svg",
    description: "Majestic peacock with flared royal plumage.",
    recommendedEnter: "float-in-right",
    recommendedIdle: "subtle-wavy",
  },

  // 3. VIGNETTES & ARCHES
  {
    id: "corner_arch",
    name: "Temple Corner Arch",
    category: "vignettes",
    assetPath: "/assets/vignettes/corner-arch.svg",
    description: "Intricate golden temple arch flourish for corner framing.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "shimmer-shine",
  },
  {
    id: "floral_divider",
    name: "Lotus Garland Border",
    category: "vignettes",
    assetPath: "/assets/vignettes/floral-divider.svg",
    description: "Horizontal decorative garland with central lotus emblem.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "none",
  },
  {
    id: "temple_shikhara",
    name: "Temple Shikhara",
    category: "vignettes",
    assetPath: "/assets/vignettes/temple-shikhara.svg",
    description: "Vedic mandir spire silhouette with kalasha & victory flag.",
    recommendedEnter: "float-in-bottom",
    recommendedIdle: "shimmer-shine",
  },
  {
    id: "mandala_accent",
    name: "Spiritual Mandala",
    category: "vignettes",
    assetPath: "/assets/vignettes/mandala-accent.svg",
    description: "Geometric sacred floral mandala medallion.",
    recommendedEnter: "spin-in",
    recommendedIdle: "slow-spin",
  },

  // 4. STICKERS & SACRED SEALS
  {
    id: "script_radhe",
    name: "Shri Radhe Calligraphy",
    category: "stickers",
    assetPath: "/assets/stickers/script-radhe.svg",
    description: "Golden embossed 'राधे राधे' sacred script pill badge.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "script_hare_krishna",
    name: "Hare Krishna Seal",
    category: "stickers",
    assetPath: "/assets/stickers/script-hare-krishna.svg",
    description: "Sacred Maha-Mantra seal with golden illumination.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "sacred_om",
    name: "Sacred Omkara",
    category: "stickers",
    assetPath: "/assets/stickers/sacred-om.svg",
    description: "Venerated Om symbol surrounded by celestial aura.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "gentle-pulse",
  },
  {
    id: "flower_petal",
    name: "Marigold Blossom",
    category: "stickers",
    assetPath: "/assets/stickers/flower-petal.svg",
    description: "Vibrant golden flower petal for festive decoration.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "subtle-wavy",
  },
  {
    id: "divine_sparkle",
    name: "Holy Starburst",
    category: "stickers",
    assetPath: "/assets/stickers/divine-sparkle.svg",
    description: "4-point holy radiance light sparkle.",
    recommendedEnter: "fade-scale",
    recommendedIdle: "shimmer-shine",
  },
];

export const getAssetById = (id?: string | null): AssetItem | undefined => {
  if (!id) return undefined;
  return ASSET_REGISTRY.find((a) => a.id === id);
};

export const getAssetsByCategory = (category: AssetCategory): AssetItem[] => {
  return ASSET_REGISTRY.filter((a) => a.category === category);
};

// Aliases for motif compatibility
export type MotifItem = AssetItem;
