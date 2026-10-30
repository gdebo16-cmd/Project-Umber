export type Level = {
  level: number;
  proficiency: number;
  features: string[];
};

export type CallingFeature = {
  level: number;
  name: string;
};

export type Calling = {
  name: string;
  features: CallingFeature[];
};

export type Role = {
  name: string;
  hit_die: string;
  primary_stat: string;
  levels: Level[];
  callings: Calling[];
};

export type ScalingRule = {
  name: string;
  dice_count: number;
  dice_size: number;
  every_levels: number;
  start_level: number;
  description: string;
};

export type FeatureData = {
  action_type: string | null;
  uses: number | string | null;
  recharge: string | null;
  dice: string | null;
  save: string | null;
  range: string | null;
  duration: string | null;
  scaling: { level: number; change: string }[];
  // Create-time pickers only when choice_timing is "create" (see build.ts hoist)
  options?: string[];
  choice_count?: number;
  choice_timing?: 'create' | string;
  option_info?: Record<string, string>;
  [extra: string]: unknown; // allows extras like slot_table or cantrips
};

export type FeatureRule = {
  name: string;
  level: number;
  status: string;
  description: string;
  data: FeatureData;
};

export type RoleRules = {
  name: string;
  hit_die: string;
  primary_stat: string;
  features: FeatureRule[];
  callings?: { name: string; features: FeatureRule[] }[];
};

// Static role/calling facts for the content pack (ids match the create API)
export type CallingInfo = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  img_url: string | null;
  armor_prof?: string | null;
  weapon_prof?: string | null;
  tool_prof?: string | null;
  sort_order?: number | null;
};

export type RoleInfo = {
  id: number;
  key: string;
  name: string;
  hit_die: string;
  primary_stat: string;
  description: string | null;
  sort_order: number | null;
  armor_prof: string | null;
  weapon_prof: string | null;
  tool_prof?: string | null;
  skill_count: number | null;
  skill_options: string[];
  skill_fixed?: string[];
  spell_stat: string | null;
  spellcasting?: string | null;
  caster_type: string | null;
  img_url: string | null;
  callings: CallingInfo[];
};