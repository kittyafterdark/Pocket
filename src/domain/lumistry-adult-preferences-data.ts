/** Preserved user-supplied non-graphic adult preference taxonomy; never NPC defaults. */
export const ADULT_PREFERENCE_SOURCE = {
  "catalog_version": "3.0-draft",
  "principles": [
    "All participants are sentient adults, able to freely consent and withdraw consent.",
    "No species, heritage, anatomy, profession or universe implies any preference, availability or consent.",
    "Illustrative species references mean only that a term COULD relate to an individual with verified traits; they are not default character traits.",
    "Do not auto-assign private interests to NPCs or publish them on profiles. Require individually established preferences and explicit disclosure.",
    "Capabilities, powers and effects must exist in reviewed lore before universe-specific terms are available.",
    "No non-consensual mind control, coercive bonds, privacy invasion, real injury, or changing adults into minors.",
    "World setting, species selection, anatomy, personal preferences, consent and dating filters are independent.",
    "Do not invent species-specific erotic physiology, mating cycles or biological drives without reviewed lore, individual adult consent and user opt-in.",
    "Support opt-in, opt-out, opt-for-now, explicitly unknown, and private-not-shared states.",
    "The LLM may propose a NEW tag with a custom namespace and a human-readable definition. It never silently adds it to the accepted world or private preferences.",
    "Draft v2: high-intensity terms and taboo-coded fiction require extra review; never infer them from anatomy or a preset."
  ],
  "universe_tags": {
    "contemporary_multispecies": {
      "source_preset": "modern_multispecies",
      "description": "Modern life with lore-approved sentient species; no supernatural assumptions"
    },
    "medieval_high_fantasy": {
      "source_preset": "medieval_fantasy",
      "description": "Premodern fantasy courtship and lore-confirmed magic"
    },
    "low_fantasy_historical": {
      "source_preset": "low_fantasy",
      "description": "Historically styled courtship; no automatic magic"
    },
    "urban_fantasy": {
      "source_preset": "modern_fantasy",
      "description": "Modern romance with lore-approved supernatural people"
    },
    "spacefaring_sf": {
      "source_preset": "spacefaring",
      "description": "Starship, orbital and alien social contexts where enabled"
    },
    "cyberpunk": {
      "source_preset": "cyberpunk",
      "description": "Augmentations, VR and synthetic persons where enabled"
    },
    "gothic_romance": {
      "source_preset": null,
      "description": "Optional user-created gothic romance setting; NOT a built-in preset"
    },
    "steampunk": {
      "source_preset": null,
      "description": "Optional user-created steam/clockwork setting; NOT a built-in preset"
    },
    "solarpunk": {
      "source_preset": null,
      "description": "Optional user-created ecological future setting; NOT a built-in preset"
    },
    "aquatic_civilization": {
      "source_preset": null,
      "description": "Optional user-created aquatic realm setting; NOT a built-in preset"
    },
    "post_apocalyptic": {
      "source_preset": null,
      "description": "Optional user-created post-collapse setting; NOT a built-in preset"
    },
    "mythic_folklore": {
      "source_preset": null,
      "description": "Optional user-created folklore-centered setting; NOT a built-in preset"
    },
    "celestial_astral": {
      "source_preset": null,
      "description": "Optional user-created cosmic fantasy setting; NOT a built-in preset"
    },
    "noir_mystery": {
      "source_preset": null,
      "description": "Optional user-created noir romance setting; NOT a built-in preset"
    }
  },
  "categories": {
    "core_flirtation": {
      "name": "Everyday attraction & flirting",
      "default_kind": "flirtation"
    },
    "negotiated_dynamics": {
      "name": "Negotiated adult dynamics",
      "default_kind": "negotiated_adult_kink"
    },
    "nonhuman_aesthetics": {
      "name": "Demihuman and nonhuman anatomy",
      "default_kind": "attraction"
    },
    "nonhuman_affection": {
      "name": "Anatomy-aware affection and sensory play",
      "default_kind": "sensual_preference"
    },
    "fantasy_folklore": {
      "name": "Folklore and supernatural romance",
      "default_kind": "romantic_fantasy"
    },
    "fantasy_magic": {
      "name": "Fantasy magic and ceremonial romance",
      "default_kind": "romantic_fantasy"
    },
    "historical_romance": {
      "name": "Historical and period romance",
      "default_kind": "romantic_fantasy"
    },
    "modern_multispecies": {
      "name": "Modern mixed-species dating",
      "default_kind": "romantic_fantasy"
    },
    "cyber_synthetic": {
      "name": "Cyberpunk, synthetic and digital intimacy",
      "default_kind": "romantic_fantasy"
    },
    "space_alien": {
      "name": "Spacefaring and alien romance",
      "default_kind": "romantic_fantasy"
    },
    "other_universes": {
      "name": "Additional optional universe flavors",
      "default_kind": "romantic_fantasy"
    },
    "original_genre_terms": {
      "name": "Preserved original genre vocabulary",
      "default_kind": "negotiated_adult_kink"
    },
    "explicit_power_and_protocol": {
      "name": "Adult BDSM, power exchange and high-intensity dynamics",
      "default_kind": "negotiated_adult_kink"
    },
    "monster_and_body_fantasy": {
      "name": "Monster-person and unusual-body adult fantasies",
      "default_kind": "negotiated_adult_kink"
    },
    "dark_fantasy_gothic": {
      "name": "Dark fantasy, supernatural and gothic adult roleplay",
      "default_kind": "romantic_fantasy"
    },
    "cybernetic_alien_extreme": {
      "name": "Cybernetic, alien and futuristic adult roleplay",
      "default_kind": "romantic_fantasy"
    },
    "setting_specific_roleplay": {
      "name": "Universe-specific dramatic adult roleplay",
      "default_kind": "romantic_fantasy"
    },
    "advanced_consent_dynamics": {
      "name": "High-intensity adult kink and negotiated protocol",
      "default_kind": "negotiated_adult_kink"
    },
    "metamorphosis_mutable_bodies": {
      "name": "Mutable body and transformation fantasies",
      "default_kind": "negotiated_adult_kink"
    },
    "eldritch_uncanny": {
      "name": "Eldritch, uncanny and paranormal adult fantasies",
      "default_kind": "negotiated_adult_kink"
    },
    "alien_biology_cycles": {
      "name": "Alien biology, reproduction themes and unusual courtship",
      "default_kind": "negotiated_adult_kink"
    },
    "strange_senses_anatomy": {
      "name": "Beyond-human senses, anatomy and tactile tropes",
      "default_kind": "negotiated_adult_kink"
    },
    "arcane_contracts_gothic": {
      "name": "Arcane compacts, gothic power and ceremonial kink",
      "default_kind": "negotiated_adult_kink"
    },
    "cyber_permissions_and_synthetic": {
      "name": "Synthetic bodies, simulated control and cybernetic taboos",
      "default_kind": "negotiated_adult_kink"
    },
    "cosmic_multiversal": {
      "name": "Cosmic scale, timelines and impossible adult roleplay",
      "default_kind": "negotiated_adult_kink"
    }
  },
  "terms": [
    {
      "id": "praise_and_compliments",
      "label": "Praise and compliments",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying thoughtful praise and affirming words.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "playful_teasing",
      "label": "Playful teasing",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Mutually welcome, kind teasing during flirting.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "slow_burn_attraction",
      "label": "Slow-burn attraction",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Preferring attraction that unfolds over multiple conversations and dates.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "confident_pursuit",
      "label": "Confident first moves",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying direct but respectful expressions of interest.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "shy_flirtation",
      "label": "Shy flirting",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying bashful, tentative and reciprocated courtship.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "romantic_suspense",
      "label": "Romantic anticipation",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying suspense about an upcoming date or confession.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "flirty_challenges",
      "label": "Flirty challenges",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Optional, low-stakes challenges agreed to by both adults.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "secret_code_words",
      "label": "Private flirt codes",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Mutually agreed code words and inside references for flirting.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "romantic_voice_messages",
      "label": "Romantic voice notes",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying affectionate recorded messages where the medium exists.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "handwritten_love_notes",
      "label": "Personal love notes",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying personal notes delivered through a lore-supported medium.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "playful_rivalry",
      "label": "Playful romantic rivalry",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "A friendly, non-hostile competitive dynamic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "adoring_attention",
      "label": "Being admired",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying attention that stays within stated personal boundaries.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "quiet_affection",
      "label": "Quiet affection",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "A low-pressure preference for gentle, private affection.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "grand_romantic_gestures",
      "label": "Grand gestures",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Liking thoughtful theatrical courtship without social pressure.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "subtle_fleeting_glances",
      "label": "Subtle flirting",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying glances and small cues rather than overt declarations.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "mutual_rituals",
      "label": "Shared affection rituals",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Enjoying jointly chosen small routines or symbolic gestures.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "romantic_roleplay_stories",
      "label": "Romantic scene roleplay",
      "category": "core_flirtation",
      "kind": "flirtation",
      "description": "Mutually agreed imaginary adult romance scenarios distinct from canon.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "consensual_power_exchange",
      "label": "Consensual power exchange",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Explicitly negotiated adult leadership and followership roles, with an easy stop.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "gentle_leadership",
      "label": "Gentle leadership",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying a partner taking initiative within previously agreed limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "consensual_following",
      "label": "Consensual following",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying a partner taking the lead while retaining full choice.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "switching_roles",
      "label": "Switching roles",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying alternating who leads in mutually chosen adult scenarios.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "praise_dynamic",
      "label": "Praise-focused dynamics",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying agreed praise as a central adult intimacy preference.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "playful_challenge_dynamic",
      "label": "Playful challenge dynamics",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying mutually welcome sass and playful negotiation.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "consensual_honorifics",
      "label": "Chosen honorifics",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Using agreed adult titles during roleplay, never as actual authority.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "ceremonial_asking",
      "label": "Ritualized permission",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying a deliberate verbal request and affirmative response.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "consensual_light_restraint",
      "label": "Light restraint fantasy",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated, easily ended restraint roleplay without injury or coercion.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "consensual_blindfold",
      "label": "Blindfold and sensory focus",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Agreed limited-vision sensory play with independent communication.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "sensory_contrast",
      "label": "Sensory contrast",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying harmless textures or gentle temperature contrast, with anatomy-safe limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "affectionate_guidance",
      "label": "Guided affection",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying clearly invited, non-forceful physical guidance.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "negotiated_surprise",
      "label": "Planned surprises",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying surprises only inside an agreed range; no surprise boundary crossings.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "private_versus_public",
      "label": "Private versus public affection",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "A preference about what kinds of affection are private or public.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "romantic_costumes",
      "label": "Adult romantic costume play",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying thematic clothing and harmless costume personas.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "masked_flirting",
      "label": "Masked masquerade flirting",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Enjoying masks in a mutually identified and consent-aware adult context.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "mutual_aftercare",
      "label": "Aftercare and reassurance",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Prioritizing comfort, check-ins and reassurance after intense agreed roleplay.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "written_boundaries",
      "label": "Written shared boundaries",
      "category": "negotiated_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Preferring explicit personal yes/no/maybe agreements before any roleplay.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "pointed_ear_appreciation",
      "label": "Pointed-ear appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Finding naturally established pointed ears attractive.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "elf",
        "half_elf",
        "goblin",
        "hobgoblin",
        "half_orc"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "soft_ear_appreciation",
      "label": "Animal-ear appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Finding established mammalian or demi-human ears appealing.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "cat_eared_demihuman",
        "wolf_eared_demihuman",
        "rabbit_eared_demihuman",
        "catfolk",
        "foxfolk",
        "dogfolk",
        "batfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "tail_appreciation",
      "label": "Tail appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Finding an established tail aesthetically appealing.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragon_tailed_demihuman",
        "catfolk",
        "foxfolk",
        "lizardfolk",
        "kobold",
        "merfolk",
        "centaur"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "horn_appreciation",
      "label": "Horn appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Appreciating established horns and how someone styles them.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragon_horned_demihuman",
        "tiefling",
        "oni_person",
        "minotaur",
        "satyr",
        "goatfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "antler_appreciation",
      "label": "Antler appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Appreciating established antlers and decorations chosen by the wearer.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "antlered_demihuman",
        "deerfolk",
        "kirin_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "wing_appreciation",
      "label": "Wing appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring established feathered, membranous or other wings.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "winged_demihuman",
        "bird_winged_demihuman",
        "harpy",
        "mothfolk",
        "batfolk",
        "avianfolk",
        "dragonflyfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "feather_plumage_aesthetic",
      "label": "Feather and plumage appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring feather patterns and personal styling.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "avianfolk",
        "crowfolk",
        "owlfolk",
        "peacockfolk",
        "harpy",
        "bird_winged_demihuman"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "fur_texture_aesthetic",
      "label": "Fur and coat appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring coats, textures and grooming styles.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "foxfolk",
        "wolffolk",
        "rabbitfolk",
        "red_pandafolk",
        "batfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "scale_pattern_aesthetic",
      "label": "Scale appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring individual scale patterns, colors or reflective surfaces.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragonborn",
        "lizardfolk",
        "kobold",
        "sharkfolk",
        "snakefolk",
        "scaled_demihuman"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "fang_smile_appreciation",
      "label": "Fang and tooth aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Finding an established fanged smile appealing; no injury inferred.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "vampire",
        "werewolf",
        "wolffolk",
        "sharkfolk",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "claw_nail_aesthetic",
      "label": "Claw and nail aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Appreciating claws, nail styling and grooming where present.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "lizardfolk",
        "dragonborn",
        "catfolk",
        "griffinfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "muzzle_face_appreciation",
      "label": "Muzzle and nonhuman-face appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Attraction to individual mature nonhuman face shapes.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "wolffolk",
        "dogfolk",
        "foxfolk",
        "equinefolk",
        "catfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "hooves_aesthetic",
      "label": "Hoof aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Appreciating established hooves and personally chosen footwear.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "centaur",
        "goatfolk",
        "equinefolk",
        "bovinefolk",
        "satyr"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "whisker_aesthetic",
      "label": "Whisker appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Finding whiskers and expressive facial details endearing.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "mousefolk",
        "ratfolk",
        "otterfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "antenna_aesthetic",
      "label": "Antenna appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring established antennae and their expressive qualities.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "mothfolk",
        "butterflyfolk",
        "beetlefolk",
        "insectfolk",
        "antfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "fin_gill_aesthetic",
      "label": "Fin and gill aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Appreciating aquatic fins and gill structures where established.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "merfolk",
        "sharkfolk",
        "fishfolk",
        "aquatic_alien",
        "axolotlfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "shell_carapace_aesthetic",
      "label": "Shell and carapace appreciation",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring protective shells and exoskeletal patterns.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "turtlefolk",
        "crabfolk",
        "lobsterfolk",
        "beetlefolk",
        "arachnidfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "bioluminescent_markings",
      "label": "Bioluminescent markings",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Finding naturally luminous patterns appealing.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "fireflyfolk",
        "jellyfishfolk",
        "anglerfishfolk",
        "energy_person",
        "plasma_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "nonhuman_eye_aesthetic",
      "label": "Unusual eyes",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring lore-established eyes, pupils, facets or luminous gaze.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "alien_humanoid",
        "arachnidfolk",
        "insectfolk",
        "android",
        "cyclops_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "tentacle_appendage_aesthetic",
      "label": "Tentacle and appendage aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring sentient cephalopod or similarly configured adult body plans.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "octopusfolk",
        "squidfolk",
        "cephalopod_alien",
        "swarm_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "crystal_mineral_aesthetic",
      "label": "Crystalline bodies",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring coherent crystal, gemstone and mineral surfaces.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "crystal_person",
        "crystalline_alien",
        "silicon_person",
        "stone_elemental_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "porcelain_clockwork_aesthetic",
      "label": "Doll and clockwork aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring sentient doll or clockwork body design.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "porcelain_doll_person",
        "clockwork_person",
        "wooden_doll_person",
        "golem"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "botanical_bloom_aesthetic",
      "label": "Petals and foliage aesthetics",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring individual botanical features and seasonal decoration.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "flower_person",
        "dryad",
        "plant_person",
        "alraune_person",
        "treefolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "slime_translucence_aesthetic",
      "label": "Gelatinous and translucent forms",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring stable adult sentient gelatinous or ink-based forms.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "slime_person",
        "living_ink_person",
        "glass_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "flame_light_aesthetic",
      "label": "Luminous elemental forms",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring sentient light, flame, glow or plasma surfaces.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "flame_person",
        "light_person",
        "plasma_person",
        "energy_person",
        "elemental_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "synthetic_design_aesthetic",
      "label": "Synthetic body design",
      "category": "nonhuman_aesthetics",
      "kind": "attraction",
      "description": "Admiring person-chosen mechanical, android or biotech appearance.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "android",
        "robot_person",
        "soft_robot_person",
        "modular_robot_person",
        "biomechanical_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "consensual_ear_touch",
      "label": "Ear-aware affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Agreed gentle affection near sensitive ears only if the character welcomes it.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "cat_eared_demihuman",
        "rabbit_eared_demihuman",
        "catfolk",
        "elf",
        "foxfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "consensual_tail_contact",
      "label": "Tail-aware affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Respecting independently agreed contact and movement around a tail.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "foxfolk",
        "dragon_tailed_demihuman",
        "kobold",
        "merfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "consensual_horn_decoration",
      "label": "Horn decoration together",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Choosing decorative accessories with a horned partner's permission.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "oni_person",
        "tiefling",
        "minotaur",
        "dragon_horned_demihuman"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "consensual_wing_care",
      "label": "Wing-aware care",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Optional gentle feather or wing care, only if anatomically safe and welcomed.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "harpy",
        "winged_demihuman",
        "mothfolk",
        "batfolk",
        "avianfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "consensual_fur_grooming",
      "label": "Mutual grooming",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Agreed brushing or grooming when appropriate to a person's coat.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "foxfolk",
        "wolffolk",
        "red_pandafolk",
        "bearfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "consensual_feather_grooming",
      "label": "Feather care",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Optional mutual feather maintenance, if the person invites it.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "peacockfolk",
        "owlfolk",
        "avianfolk",
        "harpy"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "scale_safe_touch",
      "label": "Scale-aware affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Touch that respects established texture, shedding and sensitivity.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragonborn",
        "lizardfolk",
        "kobold",
        "scaled_demihuman"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "antenna_safe_touch",
      "label": "Antenna-aware affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Permission-based touch that accounts for sensory antennae.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "mothfolk",
        "insectfolk",
        "beefolk",
        "antfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "claw_safe_handholding",
      "label": "Claw-aware handholding",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Finding a comfortable, consensual way to hold hands across differing anatomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragonborn",
        "catfolk",
        "lizardfolk",
        "griffinfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "multiple_arm_embraces",
      "label": "Multiple-arm embraces",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Coordinating welcomed affection with adults with more than two arms.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "octopusfolk",
        "cephalopod_alien",
        "arachnidfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "serpentine_body_cuddling",
      "label": "Serpentine-form closeness",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Comfortable proximity with naga or snake-bodied adults without restrictive pressure.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "naga",
        "lamia",
        "snakefolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "centaur_body_aware_affection",
      "label": "Centaur body-aware affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Safe affectionate positioning across humanoid and equine body proportions.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "centaur",
        "kelpie_person",
        "equinefolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "size_difference_affection",
      "label": "Adult size-difference affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Mutual preference for size contrast with safety and accessibility considered.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "giant",
        "half_giant",
        "ogre",
        "gnome",
        "halfling",
        "fairy"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "water_compatible_affection",
      "label": "Aquatic-compatible affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Affection adapted to aquatic or amphibious physiology where established.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "merfolk",
        "aquatic_alien",
        "fishfolk",
        "sharkfolk",
        "octopusfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "wing_span_space_needs",
      "label": "Wing-span-aware closeness",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Comfortable space and accommodation for a winged person's movement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "harpy",
        "winged_demihuman",
        "batfolk",
        "mothfolk",
        "avianfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "nonhuman_surface_sensation",
      "label": "Nonhuman surface sensory preference",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Agreed attention to fur, scales, stone, synthetic or other confirmed body surfaces.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "slime_person",
        "synthetic_organic",
        "catfolk",
        "stone_elemental_person",
        "crystal_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "synthetic_touch_boundaries",
      "label": "Synthetic touch boundaries",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Respecting personal sensory settings and physical boundaries of a synthetic person.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "android",
        "robot_person",
        "cyborg",
        "synthetic_organic",
        "soft_robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "light_based_affection",
      "label": "Light-based affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Mutually welcomed display of glow or color change where the person can do so.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "light_person",
        "energy_person",
        "plasma_person",
        "fireflyfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "shape_stable_affection",
      "label": "Form-aware affection",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Clear advance agreement about a shapeshifter's currently chosen adult form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "shapeshifter",
        "changeling",
        "werewolf",
        "shapeshifting_alien",
        "kitsune_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "scent_and_fragrance_preference",
      "label": "Scent and fragrance preferences",
      "category": "nonhuman_affection",
      "kind": "sensual_preference",
      "description": "Optional attraction to scents or perfume; never assumed from species biology.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "human",
        "catfolk",
        "foxfolk",
        "flower_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "vampire_romance_aesthetic",
      "label": "Vampire romance aesthetics",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Enjoying fictional nocturnal elegance without assuming feeding or immortality rules.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "vampire"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "negotiated_fang_roleplay",
      "label": "Consensual fang roleplay",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Non-injurious fictional fang-themed adult roleplay, if both opt in.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "vampire",
        "dragonborn",
        "kobold"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "moonlit_courtship",
      "label": "Moonlit courtship",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Enjoying moon-themed romance associated with willing supernatural partners.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "werewolf",
        "wolffolk",
        "shapeshifter"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "shifter_form_admiration",
      "label": "Chosen shifter form admiration",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Appreciating a consciously chosen, sapient adult transformation form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "werewolf",
        "changeling",
        "shapeshifting_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "shifter_identity_trust",
      "label": "Shifter identity disclosure",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Enjoying consensual vulnerability around revealing an established other form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "werewolf",
        "changeling",
        "shapeshifting_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "fae_name_play",
      "label": "Fae-name courtship",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "A folklore-themed adult nickname ritual with no binding loss of autonomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "fae",
        "fairy",
        "fae_descended_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "fae_bargain_roleplay",
      "label": "Fae bargain roleplay",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Play-acted symbolic bargains with fully reversible, clearly agreed terms.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "fae",
        "fairy",
        "fae_descended_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "fox_spirit_courtship",
      "label": "Fox-spirit courtship themes",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Enjoying fox-spirit folklore romance only when the world's lore supports it.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "kitsune_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "oni_folklore_romance",
      "label": "Oni folklore aesthetics",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Admiring established oni-inspired horns or traditional attire without assuming temperament.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "oni_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "selkie_shoreline_romance",
      "label": "Selkie shoreline romance",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Coastal folklore romance with autonomy and freedom of movement preserved.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "selkie_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "siren_song_appreciation",
      "label": "Siren-song appreciation",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Enjoying a singer's voice where there is no compelled attraction or mental override.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "siren_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "spirit_dance",
      "label": "Spectral dance fantasy",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Romantic dancing with a fully sentient spirit who can communicate and consent.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "ghost",
        "revenant",
        "banshee_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "gothic_masquerade",
      "label": "Gothic masquerade",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Enjoying adult gothic-costume mystery with the participants' identities understood.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "vampire",
        "ghost",
        "revenant"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "phoenix_renewal_courtship",
      "label": "Phoenix renewal symbolism",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Romance centered on a phoenix-like person's chosen renewal symbols.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "phoenix_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "elemental_temperature_romance",
      "label": "Elemental warmth and coolness",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Lore-compatible gentle temperature themes with ordinary physical safety limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "flame_person",
        "ice_elemental_person",
        "water_elemental_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "draconic_gift_courtship",
      "label": "Draconic gift courtship",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Exchange of meaningful objects if a particular person follows that custom.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "dragonborn",
        "draconic_person",
        "kobold"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "celestial_sigils_romance",
      "label": "Celestial sigil admiration",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Romantic appreciation of chosen halos, symbols or celestial ornaments.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "mythic_folklore",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "aasimar",
        "celestial",
        "fae_descended_person",
        "light_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "immortal_mortal_romance",
      "label": "Different-lifespan romance",
      "category": "fantasy_folklore",
      "kind": "romantic_fantasy",
      "description": "Exploring adult partners with different expected lifespans, without automatic status inequality.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "vampire",
        "elf",
        "revenant",
        "android",
        "human"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "spellwork_as_courtship",
      "label": "Collaborative spellwork romance",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Mutually chosen spellcraft as a form of courtship where magic actually exists.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "enchanted_love_letters",
      "label": "Enchanted love notes",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Lore-permitted written affection through magical delivery or decoration.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "magical_garden_dates",
      "label": "Magical garden dates",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Romance in an established enchanted environment.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "protective_ward_gifts",
      "label": "Protective ward gifting",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Voluntarily accepted magical protection tokens, never tracking devices.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "magical_costume_changes",
      "label": "Magical outfit roleplay",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Reversible, adult-appropriate costume appearance changes with informed consent.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "illusion_scenery_romance",
      "label": "Illusion scenery romance",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Co-created imaginary scenery without deception about identities or reality.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "shared_ritual_vows",
      "label": "Shared magical vows",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Symbolic, revocable ceremonial romantic promises.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "fantasy_size_variation",
      "label": "Reversible adult size variation",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "If supported by lore, optional harmless size changes between fully adult consenting persons.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "elemental_aura_admiration",
      "label": "Elemental aura appreciation",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Admiring a sentient person's established visible magical aura.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "elemental_person",
        "light_person",
        "flame_person",
        "storm_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "magical_music_courtship",
      "label": "Enchanted musical courtship",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Musical magical expression without compulsion, enthrallment or altered agency.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "animated_object_gift",
      "label": "Sentient-safe animated gifts",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Romantic decorative objects animated by lore-permitted magic, without assigning sentient beings as possessions.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "portal_date_fantasy",
      "label": "Portal-assisted dates",
      "category": "fantasy_magic",
      "kind": "romantic_fantasy",
      "description": "Romantic travel by mutually chosen magical portals where feasible.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "courtly_titles",
      "label": "Courtly honorifics",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Agreed adult courtship titles used as fiction rather than genuine control.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "formal_dance_romance",
      "label": "Formal dance romance",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Enjoying period-inspired dances and invitations.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "masked_ball_romance",
      "label": "Masked ball flirtation",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Enjoying a consensual masquerade with known adult participants.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "handwritten_correspondence",
      "label": "Period love correspondence",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Private letters and poems in a lore-appropriate medium.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "chivalric_devotion_roleplay",
      "label": "Chivalric devotion roleplay",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Mutually invited chivalric courtship free from actual obligation.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "heirloom_gift_courtship",
      "label": "Heirloom gift symbolism",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Exchanging symbolic gifts without purchasing loyalty or affection.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "period_fashion_admiration",
      "label": "Period fashion appreciation",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Admiring historically inspired clothing fitted to the character's body.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "forbidden_class_romance_fiction",
      "label": "Cross-class romance fiction",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Playing with class-difference storytelling without coercion or professional retaliation.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "royal_court_romance",
      "label": "Royal court roleplay",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Adult courtly drama with optional, nonbinding titles.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "steampunk_gentleman_romance",
      "label": "Steampunk courtship style",
      "category": "historical_romance",
      "kind": "romantic_fantasy",
      "description": "Clockwork-era inspired formal flirting where the world supports it.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "species_culture_exchange",
      "label": "Species-culture courtship",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Enjoying mutual learning about personally meaningful cross-cultural dating norms.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "multispecies_fashion",
      "label": "Cross-anatomy fashion appreciation",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Appreciating tailored clothes made for different accepted anatomies.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "anatomy_aware_date_planning",
      "label": "Anatomy-aware date planning",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Finding venues and seating comfortable for both adult partners.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "dating_across_lifespans",
      "label": "Different-lifespan dating",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Mutually choosing how to discuss practical lifespan differences.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "interplanetary_or_crossrealm_flirting",
      "label": "Cross-realm online flirting",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Enjoying distance and language differences where the network and lore allow it.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "species_appropriate_compliments",
      "label": "Anatomy-respectful compliments",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Compliments chosen around individually welcomed features rather than species stereotypes.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "customary_greeting_exchange",
      "label": "Courtship greeting exchange",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Learning partner-specific social greetings rather than inventing universal species rituals.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "public_private_identity",
      "label": "Public/private supernatural identity",
      "category": "modern_multispecies",
      "kind": "romantic_fantasy",
      "description": "Respecting someone's chosen disclosure of their species, condition or form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "contemporary_multispecies",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "augmentation_aesthetic",
      "label": "Augmentation appreciation",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Admiring an adult person's chosen cybernetic design.",
      "requires_world_capabilities": [
        "augmentation"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "cyborg",
        "biomechanical_person",
        "space_adapted_human"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "prosthetic_style_romance",
      "label": "Prosthetic personal-style appreciation",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Finding individual personalisation of prosthetics appealing without objectification.",
      "requires_world_capabilities": [
        "augmentation"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "cyborg",
        "human",
        "biomechanical_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "private_vr_date",
      "label": "Private virtual date worlds",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Mutually agreed adult romance in a privacy-protected virtual scene.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf",
        "contemporary_multispecies"
      ],
      "illustrative_species_ids": [
        "virtual_avatar_person",
        "holographic_person",
        "android"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "avatar_style_roleplay",
      "label": "Chosen avatar roleplay",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Roleplay using voluntarily chosen adult avatars with clear identity disclosure.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "virtual_avatar_person",
        "distributed_ai_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "encrypted_love_messages",
      "label": "Encrypted love messages",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Enjoying discreet communication through lore-supported secure channels.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf",
        "contemporary_multispecies"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "neon_noir_courtship",
      "label": "Neon-noir courtship",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Enjoying neon-city romance aesthetics without compulsory danger.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "consensual_haptic_feedback",
      "label": "Haptic affection preferences",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Optional, mutually configured safe digital touch sensations.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "synthetic_voice_aesthetic",
      "label": "Synthetic voice appreciation",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Enjoying synthetic or processed speaking voices as a personal preference.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person",
        "distributed_ai_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "modular_body_styling",
      "label": "Modular body styling",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Admiring elective modular synthetic appearance chosen by the person.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "modular_robot_person",
        "robot_person",
        "soft_robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "robotic_gesture_romance",
      "label": "Synthetic gesture affection",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Enjoying a particular synthetic person's intentional nonverbal gestures.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person",
        "soft_robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "safe_neural_link_romance",
      "label": "Consent-gated neural-link fantasy",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Only with lore support and separately revocable mental privacy permissions.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "biomechanical_pattern_aesthetic",
      "label": "Biomechanical pattern appreciation",
      "category": "cyber_synthetic",
      "kind": "romantic_fantasy",
      "description": "Admiring personally chosen integrated organic/mechanical visual design.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "biomechanical_person",
        "cyborg",
        "synthetic_organic"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "zero_gravity_romance",
      "label": "Zero-gravity romance",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Mutual romance in low gravity where appropriate safety systems exist.",
      "requires_world_capabilities": [
        "orbital_habitats"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "starship_uniform_aesthetic",
      "label": "Starship uniform aesthetics",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Attraction to a willing adult's occupational or ceremonial spacewear.",
      "requires_world_capabilities": [
        "starships"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "cosmic_observation_dates",
      "label": "Stargazing dates",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Enjoying views of planets, nebulas or station windows.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "alien_sensory_compatibility",
      "label": "Alien sensory exploration",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Discussing individual, mutually compatible sensory preferences across species.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "aquatic_alien",
        "arthropod_alien",
        "photosynthetic_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "first_contact_courtship",
      "label": "First-contact flirting",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Optional polite cross-culture courtship where first-contact context is established.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "hologram_date_projection",
      "label": "Holographic date projection",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Use of agreed virtual presence without deception about physical location.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "holographic_person",
        "virtual_avatar_person",
        "distributed_ai_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "telepresence_affection",
      "label": "Long-distance telepresence",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Enjoying remote affectionate communication with privacy control.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "bioluminescent_signaling",
      "label": "Luminous signaling appreciation",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Enjoying voluntary visual communication by an adult luminous person.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "energy_person",
        "plasma_person",
        "jellyfishfolk",
        "fireflyfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "spacesuit_styling",
      "label": "Spacesuit and pressure-suit styling",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Appreciating practical or decorative spacewear when environmental conditions require it.",
      "requires_world_capabilities": [
        "starships"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "artificial_gravity_dance",
      "label": "Variable-gravity dance",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Romantic dancing under safely established, nonstandard gravity.",
      "requires_world_capabilities": [
        "orbital_habitats"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "interstellar_language_flirting",
      "label": "Interstellar language flirting",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Learning affectionate phrases with correct context rather than invented species assumptions.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "space_adapted_human",
        "human_alien_hybrid"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "shared_shipboard_ritual",
      "label": "Shipboard courtship rituals",
      "category": "space_alien",
      "kind": "romantic_fantasy",
      "description": "Voluntary shipboard-date customs without rank-based pressure.",
      "requires_world_capabilities": [
        "starships"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "underwater_bioluminescent_dates",
      "label": "Underwater luminous dates",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Romance in a water-compatible realm with established breathing needs.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "merfolk",
        "jellyfishfolk",
        "fishfolk",
        "aquatic_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "steampunk_clockwork_aesthetic",
      "label": "Clockwork fashion and devices",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Enjoying period-futurist mechanical design and personal accessories.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "steampunk"
      ],
      "illustrative_species_ids": [
        "clockwork_person",
        "golem",
        "cyborg"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "solarpunk_garden_romance",
      "label": "Solarpunk garden courtship",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Enjoying plant-filled ecological communities and gentle romantic gestures.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "solarpunk"
      ],
      "illustrative_species_ids": [
        "dryad",
        "flower_person",
        "treefolk",
        "plant_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "postcollapse_found_object_gifts",
      "label": "Found-object romantic gifts",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Gifting personally meaningful found objects without creating dependency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "post_apocalyptic"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "gothic_candlelit_romance",
      "label": "Gothic candlelit romance",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Enjoying an eerie historical setting as a chosen adult romance aesthetic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "noir_secret_identity_game",
      "label": "Noir mystery flirtation",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Playful fictional detective-style mystery with known identities and privacy limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "noir_mystery"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "mythic_festival_courtship",
      "label": "Mythic festival romance",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Mutually chosen courtship at a lore-established festival.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "celestial_constellation_letters",
      "label": "Constellation love letters",
      "category": "other_universes",
      "kind": "romantic_fantasy",
      "description": "Romantic messages themed around accepted astronomy or astral magic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "celestial",
        "aasimar",
        "energy_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "legacy_negotiated_magical_restraints",
      "label": "negotiated magical restraints",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: fantasy_magic.",
      "required_setting_support": "fantasy_magic",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_reversible_magical_sensory_play",
      "label": "reversible magical sensory play",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: fantasy_magic.",
      "required_setting_support": "fantasy_magic",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_consensual_glamour_and_illusion_roleplay",
      "label": "consensual glamour and illusion roleplay",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: fantasy_magic.",
      "required_setting_support": "fantasy_magic",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_negotiated_reversible_adult_form_transformation",
      "label": "negotiated reversible adult-form transformation",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: fantasy_magic.",
      "required_setting_support": "fantasy_magic",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_negotiated_levitation_play",
      "label": "negotiated levitation play",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: fantasy_magic.",
      "required_setting_support": "fantasy_magic",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_consensual_telepathic_intimacy_with_privacy_limits",
      "label": "consensual telepathic intimacy with privacy limits",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: fantasy_magic.",
      "required_setting_support": "fantasy_magic",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_fantasy_costume_and_courtly_roleplay",
      "label": "fantasy costume and courtly roleplay",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: historic.",
      "required_setting_support": "historic",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_consensual_ceremonial_roleplay",
      "label": "consensual ceremonial roleplay",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: historic.",
      "required_setting_support": "historic",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_armor_and_period_clothing_appreciation",
      "label": "armor and period-clothing appreciation",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: historic.",
      "required_setting_support": "historic",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_negotiated_knight_and_noble_roleplay",
      "label": "negotiated knight and noble roleplay",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: historic.",
      "required_setting_support": "historic",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical",
        "gothic_romance",
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_consensual_haptic_sensory_play",
      "label": "consensual haptic sensory play",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: digital_networks.",
      "required_setting_support": "digital_networks",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf",
        "contemporary_multispecies"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_private_virtual_world_adult_roleplay",
      "label": "private virtual-world adult roleplay",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: digital_networks.",
      "required_setting_support": "digital_networks",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf",
        "contemporary_multispecies"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_consensual_remote_device_play",
      "label": "consensual remote-device play",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: digital_networks.",
      "required_setting_support": "digital_networks",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf",
        "contemporary_multispecies"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_augmentation_aware_sensory_preferences",
      "label": "augmentation-aware sensory preferences",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: augmentation.",
      "required_setting_support": "augmentation",
      "requires_world_capabilities": [
        "augmentation"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_adult_synthetic_partner_attraction",
      "label": "adult synthetic-partner attraction",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: synthetic_bodies.",
      "required_setting_support": "synthetic_bodies",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_negotiated_zero_gravity_intimacy",
      "label": "negotiated zero-gravity intimacy",
      "category": "original_genre_terms",
      "kind": "negotiated_adult_kink",
      "description": "Original catalog term; see required setting support: orbital_habitats.",
      "required_setting_support": "orbital_habitats",
      "requires_world_capabilities": [
        "orbital_habitats"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_spacefaring_costume_roleplay",
      "label": "spacefaring costume roleplay",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: starships.",
      "required_setting_support": "starships",
      "requires_world_capabilities": [
        "starships"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false
    },
    {
      "id": "legacy_horn_appreciation",
      "label": "horn appreciation",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: No era restriction; individual anatomy and context still apply.",
      "required_setting_support": "No era restriction; individual anatomy and context still apply",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragon_horned_demihuman",
        "tiefling",
        "oni_person"
      ],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "legacy_scale_and_nonhuman_surface_appreciation",
      "label": "scale and nonhuman-surface appreciation",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: No era restriction; individual anatomy and context still apply.",
      "required_setting_support": "No era restriction; individual anatomy and context still apply",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragonborn",
        "lizardfolk",
        "stone_elemental_person"
      ],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "legacy_wing_aware_affection",
      "label": "wing-aware affection",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: No era restriction; individual anatomy and context still apply.",
      "required_setting_support": "No era restriction; individual anatomy and context still apply",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "harpy",
        "winged_demihuman",
        "mothfolk"
      ],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "legacy_tail_aware_affection",
      "label": "tail-aware affection",
      "category": "original_genre_terms",
      "kind": "romantic_fantasy",
      "description": "Original catalog term; see required setting support: No era restriction; individual anatomy and context still apply.",
      "required_setting_support": "No era restriction; individual anatomy and context still apply",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "foxfolk",
        "dragon_tailed_demihuman"
      ],
      "legacy": true,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true
    },
    {
      "id": "rp_dominance_and_submission",
      "label": "Dominance and submission",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Explicitly negotiated roles involving leadership, following, and reversibility.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_rope_bondage",
      "label": "Rope bondage",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Adult rope restraint roleplay with independently agreed limits, comfort and release.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_shibari_aesthetics",
      "label": "Shibari aesthetics",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Appreciation of intricate rope artistry within a negotiated adult scene.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_impact_play",
      "label": "Impact play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Pre-negotiated adult impact-based play with intensity limits and aftercare.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_discipline_roleplay",
      "label": "Discipline roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Agreed rules, consequences and opt-out boundaries in a fictional dynamic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_service_submission",
      "label": "Service submission",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Consensual service rituals and acts of attention, with clear autonomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_high_protocol",
      "label": "High protocol",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Formalized titles, etiquette and check-ins during an agreed roleplay.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_collaring_symbolism",
      "label": "Collaring symbolism",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "A mutually agreed collar as a relationship or roleplay symbol, not ownership.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_ownership_fantasy",
      "label": "Ownership fantasy",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "A fictional possessive dynamic without actual control over anyone's choices.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_worship_dynamics",
      "label": "Worship dynamics",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Reverential attention and consensual admiration as an adult power dynamic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_body_worship",
      "label": "Body worship",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Consensual focused appreciation of a partner's body, without entitlement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_degradation_play",
      "label": "Degradation play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated harsh language within defined limits and agreed aftercare.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_humiliation_play",
      "label": "Humiliation play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Consensual embarrassment-themed adult roleplay with explicit hard limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_praise_kink",
      "label": "Praise kink",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Finding affirming words central to an adult dynamic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_brat_and_tamer_roles",
      "label": "Brat and tamer roles",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Playful resistance and responsive leadership between consenting adults.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_tease_and_denial",
      "label": "Tease and denial",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated teasing and withholding as an adult roleplay theme.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_orgasm_control",
      "label": "Orgasm control",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Explicitly negotiated control of timing and limits in adult intimacy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_chastity_dynamics",
      "label": "Chastity dynamics",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Mutually agreed restraint-and-permission themes; no coercion or permanent control.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_sensory_deprivation",
      "label": "Sensory deprivation",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Agreed reduction of sight or sound with communication safeguards.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_temperature_play",
      "label": "Temperature play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated warm/cool sensory contrast with safe physical boundaries.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_wax_play_aesthetics",
      "label": "Wax-play aesthetics",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Fictional or safely adapted wax imagery with clear comfort limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_predator_and_prey_roleplay",
      "label": "Predator and prey roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Adult, consensual pursuit fantasy with an agreed stop signal.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_primal_chase",
      "label": "Primal chase",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "An agreed chase scenario; never actual harassment or unwanted pursuit.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_adult_pet_play",
      "label": "Adult pet play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Human or sentient-adult roleplay of companion-animal mannerisms; never real animals.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_handler_and_companion_roles",
      "label": "Handler and companion roles",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated caretaker and companion roleplay between adults.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_prisoner_and_captor_fiction",
      "label": "Prisoner and captor fiction",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "A scripted fictional power-imbalance scenario, not actual confinement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_interrogation_roleplay",
      "label": "Interrogation roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "A pre-agreed fictional questioning scenario with unrestricted ability to stop.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_villain_and_willing_accomplice",
      "label": "Villain and willing accomplice",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Two adults knowingly adopting dramatic villainous roles in private fiction.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_royal_command_play",
      "label": "Royal command play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "A voluntarily adopted monarch-and-courtier dynamic with revocable roles.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "low_fantasy_historical"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_mentor_and_apprentice_roleplay",
      "label": "Mentor and apprentice roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "A fictional adult-adult authority dynamic without real dependency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_rivalry_to_surrender_roleplay",
      "label": "Rivalry-to-surrender roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Competitive adults negotiate a dramatic reversal of roles.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_public_risk_fantasy_in_private",
      "label": "Public-risk fantasy in private",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Staged private roleplay about being observed; no unsuspecting bystanders.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_exhibitionist_roleplay_simulation",
      "label": "Exhibitionist roleplay simulation",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Consensual fictional visibility fantasy; not public exposure.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_voyeurism_roleplay_simulation",
      "label": "Voyeurism roleplay simulation",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Consensual staged watching fantasy involving only opted-in adults.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_strangers_again_roleplay",
      "label": "Strangers-again roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Established partners pretend to meet for the first time.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_masks_and_anonymity",
      "label": "Masks and anonymity",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Roleplay with identity mystery that never hides real consent information.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_role_reversal_fantasy",
      "label": "Role reversal fantasy",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Partners explicitly exchange expected roles by agreement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_jealousy_roleplay",
      "label": "Jealousy roleplay",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Scripted possessive dialogue without real isolation or pressure.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_obsession_fantasy",
      "label": "Obsession fantasy",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Mutually agreed fictional fixation without tracking, harassment or threats.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_ritualized_permission_play",
      "label": "Ritualized permission play",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Invented ceremonial permission scripts with real-world opt-out always available.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_power_exchange_aftercare",
      "label": "Power-exchange aftercare",
      "category": "explicit_power_and_protocol",
      "kind": "negotiated_adult_kink",
      "description": "Planned reassurance, debriefing and reconnection after intense adult roleplay.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_tentacle_contact_fantasy",
      "label": "Tentacle-contact fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Consensual fantasy involving sentient adult appendage-bearing characters; no non-sentient animals.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "octopusfolk",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_multiple_arm_closeness",
      "label": "Multiple-arm closeness",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Exploring the social and tactile possibilities of an adult with several arms.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "insectfolk",
        "arachnidfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_coiling_roleplay",
      "label": "Coiling roleplay",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated serpentine body positioning with strict comfort and breath-safety rules.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "naga",
        "lamia"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_fang_themed_play",
      "label": "Fang-themed play",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Consensual fictional biting and fang symbolism; no injury assumed.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "vampire",
        "wolffolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_claw_themed_play",
      "label": "Claw-themed play",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Aesthetic or simulated claw contact with clear limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragonborn",
        "catfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_tail_guided_flirting",
      "label": "Tail-guided flirting",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Consensual flirtation involving a character's real established tail.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "foxfolk",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_wing_enclosure_fantasy",
      "label": "Wing enclosure fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Dramatic wing wrapping or sheltering in a negotiated romantic context.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "harpy",
        "fae",
        "avianfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_antenna_sensory_fantasy",
      "label": "Antenna sensory fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Optional sensory-focused contact respecting established antenna anatomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_living_fur_sensory_play",
      "label": "Living-fur sensory play",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Chosen sensory play with an adult's fur or coat; never assumed from species.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "catfolk",
        "foxfolk",
        "wolffolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_scale_touch_fixation",
      "label": "Scale-touch fixation",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Anatomy-specific interest involving confirmed scaled surfaces.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "dragonborn",
        "lizardfolk",
        "naga"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_horns_and_control_fantasy",
      "label": "Horns and control fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Chosen horn-related symbolism without unsafe grabbing or assumptions.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "tiefling",
        "minotaur"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_size_play_fantasy",
      "label": "Size-play fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fictional large/small adult size scenarios with negotiated roles.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "giant",
        "halfling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_giant_person_dynamic",
      "label": "Giant-person dynamic",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fantastical consensual adult scale difference without danger or infantilization.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "giant"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_tiny_adult_dynamic",
      "label": "Tiny-adult dynamic",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fictional adult miniature-scale scenario, never child-coded.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "fairy",
        "gnome"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_transformation_fascination",
      "label": "Transformation fascination",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Romantic or adult roleplay around safe, voluntary form changes.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_partial_transformation_roleplay",
      "label": "Partial transformation roleplay",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Opt-in temporary appearance or limb changes permitted by established lore.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "werewolf"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_true_form_reveal_fantasy",
      "label": "True-form reveal fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "A character knowingly reveals a previously private nonhuman form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "demon",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_monster_and_admirer_dynamic",
      "label": "Monster-and-admirer dynamic",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Consensual adult fascination with an unmistakably nonhuman sentient partner.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_slime_engulfment_fantasy",
      "label": "Slime engulfment fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fictional, reversible enveloping imagery between independently consenting adult beings.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "slime_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_gelatinous_body_contact",
      "label": "Gelatinous body contact",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Consent-aware fantasy about a stable adult gelatinous body plan.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "slime_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_slime_shape_duet",
      "label": "Slime-shape duet",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Two independently consenting adult identities exploring reversible linked shapes.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "slime_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_living_vine_restraint_fantasy",
      "label": "Living-vine restraint fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Opt-in plantlike restraint imagery with instant release and no physical injury.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "solarpunk"
      ],
      "illustrative_species_ids": [
        "plant_person",
        "dryad"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_mycelial_resonance_fantasy",
      "label": "Mycelial resonance fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fictional fungal sensory communication, with no psychoactive or involuntary effect.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "solarpunk"
      ],
      "illustrative_species_ids": [
        "fungal_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_elemental_heat_illusion",
      "label": "Elemental heat illusion",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Imagined heat-themed intimacy that never implies burns or bodily harm.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "elemental_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_living_shadow_embrace",
      "label": "Living-shadow embrace",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Consensual shadow-body imagery where the person retains independent agency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "demon"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_crystal_resonance_play",
      "label": "Crystal resonance play",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fantasy about responsive crystalline tones or light, respecting physical limits.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_bioluminescent_courtship_code",
      "label": "Bioluminescent courtship code",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Private, mutually agreed pattern-language in luminous anatomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization"
      ],
      "illustrative_species_ids": [
        "aquatic_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_aquatic_body_plan_intimacy",
      "label": "Aquatic body-plan intimacy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Mutual accommodation for fins, gills, tails and breathing needs.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "merfolk",
        "aquatic_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_exoskeleton_appreciation",
      "label": "Exoskeleton appreciation",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Sensory interest in an adult character's established exoskeletal anatomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [
        "insectfolk",
        "arachnidfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_feather_molt_symbolism",
      "label": "Feather-molt symbolism",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Chosen vulnerability and renewed trust through fictional feather-molt rituals.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "harpy",
        "avianfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_serpentine_dance_ritual",
      "label": "Serpentine dance ritual",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "A negotiated body-plan-aware dance with naga or lamia participants.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "naga",
        "lamia"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_living_armor_closeness",
      "label": "Living-armor closeness",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Fictional attraction to an independently sentient armored or constructed adult form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "steampunk"
      ],
      "illustrative_species_ids": [
        "golem",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_synthetic_texture_preference",
      "label": "Synthetic texture preference",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Preference for confirmed soft-synthetic, metal, ceramic or polymer surfaces.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_modular_body_aesthetics",
      "label": "Modular body aesthetics",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Negotiated interest in replaceable or reconfigurable adult synthetic body elements.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_dual_form_date_fantasy",
      "label": "Dual-form date fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "An adult shapeshifter chooses to present two canonically supported forms across a date.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_multiple_minds_consent_ritual",
      "label": "Multiple-minds consent ritual",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "An explicit agreement involving every independent adult mind in a shared body.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "swarm_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_symbiotic_partner_courtship",
      "label": "Symbiotic-partner courtship",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "A fictional adult partnership where each independent sentient symbiont consents.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "synthetic_organic"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_scent_signal_courtship",
      "label": "Scent-signal courtship",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "Opt-in use of natural aroma cues without mind-altering chemistry.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "wolffolk",
        "alien_humanoid"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_nesting_ritual_fantasy",
      "label": "Nesting ritual fantasy",
      "category": "monster_and_body_fantasy",
      "kind": "negotiated_adult_kink",
      "description": "A mutually created comfortable resting space adapted to wings, tails or large bodies.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "harpy",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_vampire_thrall_roleplay",
      "label": "Vampire thrall roleplay",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Voluntary fictional devotion themes; no actual compelled obedience or feeding.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "vampire"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_blood_oath_symbolism",
      "label": "Blood-oath symbolism",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Non-injurious ritual symbols of devotion; no blood exchange required.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_demon_contract_romance",
      "label": "Demon-contract romance",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "An explicitly revocable imagined infernal bargain between autonomous adults.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "demon",
        "tiefling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_fae_true_name_drama",
      "label": "Fae true-name drama",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Roleplay about a symbolic name freely shared, never a consent override.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "mythic_folklore",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "fae",
        "fairy"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_reversible_soul_bond_fantasy",
      "label": "Reversible soul-bond fantasy",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "An opt-in imagined mystical link with privacy and immediate severability.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "fae",
        "celestial"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_magical_geas_roleplay",
      "label": "Magical geas roleplay",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Dramatic enchantment imagery only; no actual loss of the right to refuse.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_possession_themed_roleplay",
      "label": "Possession-themed roleplay",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Fictional shared-body drama with continuous real autonomy and explicit boundaries.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "ghost",
        "demon"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_forbidden_court_romance",
      "label": "Forbidden-court romance",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Mutually chosen secrecy or political peril inside fictional courtship.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_monster_hunter_and_monster",
      "label": "Monster hunter and monster",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Two adult characters play adversaries whose interest is freely reciprocated.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "vampire",
        "werewolf"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_moonlit_pack_hierarchy_roleplay",
      "label": "Moonlit pack hierarchy roleplay",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Chosen werewolf-pack status roles, never species-determined dominance.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "urban_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "werewolf",
        "wolffolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_ritual_summoning_fantasy",
      "label": "Ritual summoning fantasy",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "A summoned adult character has full choice to accept or reject the encounter.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "demon",
        "elemental_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_cursed_lovers_plot",
      "label": "Cursed lovers plot",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "The adults negotiate a romantic scenario framed around a fictional reversible curse.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_dark_coronation_roleplay",
      "label": "Dark coronation roleplay",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Willing partners stage villainous royalty, oaths and ceremonial devotion.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_sacred_versus_profane_rivals",
      "label": "Sacred-versus-profane rivals",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Adult rivals from imagined opposing spiritual factions choose romance.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "celestial",
        "demon"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_living_statue_awakening",
      "label": "Living statue awakening",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "A consensual fantasy about an adult constructed person waking into agency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "golem",
        "porcelain_doll_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_necromancer_and_revenant_romance",
      "label": "Necromancer and revenant romance",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "An independently sentient returned adult chooses a relationship freely.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "revenant",
        "skeleton_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_phantom_ballroom",
      "label": "Phantom ballroom",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Two autonomous adults conduct a ghostly masquerade or dance scenario.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "ghost",
        "revenant"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_oracle_s_forbidden_prophecy",
      "label": "Oracle's forbidden prophecy",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Fated-lover fiction where both characters retain the ability to say no.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_reincarnated_rivals_to_lovers",
      "label": "Reincarnated rivals-to-lovers",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Adults imagine repeated lifetimes with preserved consent in the present.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_temptation_without_compulsion",
      "label": "Temptation without compulsion",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Fictional supernatural temptation that requires a freely chosen response.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "demon",
        "fae"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_magical_mirror_double",
      "label": "Magical mirror double",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "One adult uses illusions or doubles for explicitly agreed roleplay.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "gothic_romance"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "fae"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_time_stopped_masquerade",
      "label": "Time-stopped masquerade",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "A fictional private frozen-time scene, involving only participating adults.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "celestial_astral"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_binding_rune_fiction",
      "label": "Binding rune fiction",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Imaginary rune-marked restraint symbolism with no real control or injury.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_dragon_claim_roleplay",
      "label": "Dragon-claim roleplay",
      "category": "dark_fantasy_gothic",
      "kind": "romantic_fantasy",
      "description": "Fictional possessive courtship between autonomous adults; no real ownership.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "dragonborn",
        "draconic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_neural_sensation_sharing",
      "label": "Neural sensation sharing",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Reversible, explicit opt-in sharing of sensations with mental privacy preserved.",
      "requires_world_capabilities": [
        "augmentation"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "cyborg",
        "android"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_simulated_obedience_subroutine",
      "label": "Simulated obedience subroutine",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Android-themed roleplay about scripted commands, never actual autonomy suppression.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_programmable_skin_aesthetics",
      "label": "Programmable skin aesthetics",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Preference for optional synthetic texture, color or pattern settings.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "synthetic_organic"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_hologram_duplication_fantasy",
      "label": "Hologram duplication fantasy",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "One consenting adult uses several fictional projections without introducing other minds.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_avatar_body_switch_roleplay",
      "label": "Avatar body-switch roleplay",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Consensual reversible VR appearance swaps that do not alter identity or consent.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_synthetic_voice_command_play",
      "label": "Synthetic voice command play",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "A negotiated fictional voice-and-command dynamic where refusal remains possible.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_cybernetic_collar_symbolism",
      "label": "Cybernetic collar symbolism",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "A non-controlling tech accessory representing an agreed fictional dynamic.",
      "requires_world_capabilities": [
        "augmentation"
      ],
      "suggested_universe_tags": [
        "cyberpunk"
      ],
      "illustrative_species_ids": [
        "cyborg",
        "android"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_cybernetic_restraint_simulation",
      "label": "Cybernetic restraint simulation",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "A virtual, fully interruptible restraint scenario with no real disabling of movement.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_encrypted_anonymity_roleplay",
      "label": "Encrypted anonymity roleplay",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Private mystery identities with authenticated consent established beforehand.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "noir_mystery"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_alien_mating_ritual_fiction",
      "label": "Alien mating-ritual fiction",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Imagined species-specific adult courtship with explicit reciprocal choice.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "aquatic_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_pheromone_fantasy_simulation",
      "label": "Pheromone fantasy simulation",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Fictional scent-driven attraction cues; no actual chemical coercion or impaired choice.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "alien_humanoid"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_multi_limb_alien_embrace",
      "label": "Multi-limb alien embrace",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Negotiated closeness respecting a sentient alien adult's established body plan.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_gravity_control_roleplay",
      "label": "Gravity-control roleplay",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "A fictional altered-gravity scenario with safe boundaries.",
      "requires_world_capabilities": [
        "orbital_habitats"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_pressure_suit_authority_fantasy",
      "label": "Pressure-suit authority fantasy",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Two adults roleplay shipboard roles without interfering with real safety equipment.",
      "requires_world_capabilities": [
        "starships"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_captain_and_first_officer_roleplay",
      "label": "Captain and first officer roleplay",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Negotiated fictional chain-of-command romance; real consent is independent.",
      "requires_world_capabilities": [
        "starships"
      ],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_time_dilation_lovers",
      "label": "Time-dilation lovers",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Fictional romance exploiting differing experienced time without rewriting canon.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_shared_lucid_simulation",
      "label": "Shared lucid simulation",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Adults independently opt into a private, interruptible simulated shared dream.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_memory_vault_intimacy",
      "label": "Memory-vault intimacy",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Partners choose whether to share curated memories; no memory editing or theft.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_sensation_synchronization_ritual",
      "label": "Sensation-synchronization ritual",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Consensual synchronization of fictional sensory channels, reversible anytime.",
      "requires_world_capabilities": [
        "augmentation"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "cyborg",
        "android"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_modular_form_reveal",
      "label": "Modular-form reveal",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "A synthetic adult chooses to reveal an alternate, dossier-supported form.",
      "requires_world_capabilities": [
        "synthetic_bodies"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_hive_mind_courtship_rules",
      "label": "Hive-mind courtship rules",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Romance in a collective with separately tracked independent adult participants.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "swarm_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_bio_engineered_trait_fantasy",
      "label": "Bio-engineered trait fantasy",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Opt-in adult changes to visible alien traits, with no forced transformation.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "synthetic_organic"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_virtual_size_shift_fantasy",
      "label": "Virtual size-shift fantasy",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "A simulated scale-change scenario involving adult avatars.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_remote_presence_roleplay",
      "label": "Remote-presence roleplay",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Two adults stage a fictional encounter through mutually approved telepresence.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_ai_and_human_forbidden_romance",
      "label": "AI-and-human forbidden romance",
      "category": "cybernetic_alien_extreme",
      "kind": "romantic_fantasy",
      "description": "Fictional social taboo between independent adult human and sentient synthetic partners.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "robot_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_gothic_blackmail_mystery_fiction",
      "label": "Gothic blackmail mystery fiction",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Pre-scripted noir/gothic intrigue; never real extortion.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "noir_mystery"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_rival_spies_romance",
      "label": "Rival spies romance",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Adult agents roleplay mutual suspicion and attraction in invented espionage.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "noir_mystery",
        "cyberpunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_detective_and_suspect_fiction",
      "label": "Detective and suspect fiction",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "A staged adult fictional investigation; no actual coercive questioning.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "noir_mystery",
        "gothic_romance"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_privateer_captain_romance",
      "label": "Privateer captain romance",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Consensual pirate-era adventure and hierarchy roleplay in fiction.",
      "requires_world_capabilities": [
        "historic"
      ],
      "suggested_universe_tags": [
        "low_fantasy_historical",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_knight_and_dragon_courtship",
      "label": "Knight and dragon courtship",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "An adult knight and independently sentient dragon person invert classic roles.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "draconic_person",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_dueling_suitors_drama",
      "label": "Dueling suitors drama",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "A fictional rivalry with no real aggression or pressure.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "low_fantasy_historical",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_clockwork_ballroom_fantasy",
      "label": "Clockwork ballroom fantasy",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Two adults use steampunk automatons, costumes and masked identities.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "steampunk"
      ],
      "illustrative_species_ids": [
        "robot_person",
        "porcelain_doll_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_airship_officer_dynamics",
      "label": "Airship officer dynamics",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Consensual fictional rank-and-duty roleplay aboard a steampunk vessel.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "steampunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_undersea_sovereign_fantasy",
      "label": "Undersea sovereign fantasy",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Ceremonial undersea royalty and courtship between autonomous adults.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization"
      ],
      "illustrative_species_ids": [
        "merfolk",
        "fishfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_deep_ocean_bioluminescent_ritual",
      "label": "Deep-ocean bioluminescent ritual",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Private courtship signals in a lore-supported aquatic civilization.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization"
      ],
      "illustrative_species_ids": [
        "aquatic_alien",
        "merfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_post_collapse_rival_enclave_romance",
      "label": "Post-collapse rival enclave romance",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Two adults from rival settlements choose a fictional relationship.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "post_apocalyptic"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_scavenger_and_sheltered_aristocrat",
      "label": "Scavenger and sheltered aristocrat",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Voluntary culture-clash romance in a fictional post-collapse world.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "post_apocalyptic"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_mutual_survival_pact_fiction",
      "label": "Mutual-survival pact fiction",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Two adults agree to a fictional survival partnership without real dependency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "post_apocalyptic",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_rival_corporation_seduction_plot",
      "label": "Rival corporation seduction plot",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "A scripted cyberpunk corporate espionage romance; no real data theft.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_neon_underworld_masked_encounter",
      "label": "Neon underworld masked encounter",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Adult noir romance in a private cyberpunk masquerade.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "cyberpunk",
        "noir_mystery"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_celestial_oathbreakers",
      "label": "Celestial oathbreakers",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Adult cosmic rivals voluntarily rebel against fictional institutions.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "celestial",
        "demon"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_astral_projection_rendezvous",
      "label": "Astral projection rendezvous",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "A fictional reversible visit by an independently sentient astral form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "holographic_person",
        "ghost"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_living_constellation_romance",
      "label": "Living-constellation romance",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Courtship involving adult luminous celestial anatomy, as established by lore.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "energy_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_fae_winter_court_bargain",
      "label": "Fae winter-court bargain",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "Consensual, revocable fictional winter-court ceremony.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "mythic_folklore",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "fae"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "rp_dream_palace_masquerade",
      "label": "Dream-palace masquerade",
      "category": "setting_specific_roleplay",
      "kind": "romantic_fantasy",
      "description": "A scripted lucid-dream courtship without manipulating real cognition.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true
    },
    {
      "id": "v3_pre_negotiated_resistance_fiction",
      "label": "Pre-negotiated resistance fiction",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "An explicitly scripted resistance scenario with clear real-world stop signals; an actual refusal always ends the scene.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_consent_theater_hypnosis",
      "label": "Consent-theater hypnosis",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "A fictional hypnotist-and-volunteer dynamic, with no actual impairment of decision-making.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_dollification_roleplay",
      "label": "Dollification roleplay",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "An adult consensually performs a living-doll persona without losing real agency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_mannequin_display_fantasy",
      "label": "Mannequin display fantasy",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "A staged stillness-and-display theme with agreed duration and unrestricted exit.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_fetish_latex_couture",
      "label": "Fetish latex couture",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Attraction to stylized latex clothing with material and comfort considerations.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_leather_and_gloves_ritual",
      "label": "Leather-and-gloves ritual",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "An agreed ceremonial dressing or glove-focused aesthetic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_boot_worship_protocol",
      "label": "Boot-worship protocol",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Footwear-focused adult power-play with negotiated physical boundaries.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_foot_worship_focus",
      "label": "Foot-worship focus",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Adult attraction centered on feet and attention to a partner's individual comfort.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_body_writing_play",
      "label": "Body-writing play",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Temporary consensual markings or messages used as a private ritual.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_tickle_and_escape_game",
      "label": "Tickle-and-escape game",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "An agreed tickling challenge with instant stop and no actual confinement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_sound_only_sensory_play",
      "label": "Sound-only sensory play",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "A voice, rhythm or sound-guided consensual fantasy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_countdown_anticipation_ritual",
      "label": "Countdown anticipation ritual",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "A negotiated wait-and-reveal sequence where either participant can stop.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_formal_kneeling_protocol",
      "label": "Formal kneeling protocol",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Ceremonial kneeling within an adult opt-in power dynamic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_consensual_objectification_fiction",
      "label": "Consensual objectification fiction",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "A purely performed adult fantasy of being treated as an admired object, never a loss of rights.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_silence_and_gesture_game",
      "label": "Silence-and-gesture game",
      "category": "advanced_consent_dynamics",
      "kind": "negotiated_adult_kink",
      "description": "Partners voluntarily use gestures rather than words while retaining an unmistakable stop signal.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [],
      "illustrative_species_ids": [],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": false,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_liquid_silhouette_transformation",
      "label": "Liquid-silhouette transformation",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A fictional adult form fluidly changes shape while retaining the person's identity and agency.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_living_tattoo_bloom",
      "label": "Living tattoo bloom",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "Animated markings spread or rearrange by consent as an aesthetic fantasy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_glamour_form_exchange",
      "label": "Glamour-form exchange",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "Adult characters temporarily swap magical appearances without impersonating unconsenting people.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_temporary_horn_emergence",
      "label": "Temporary horn emergence",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "An opted-in body-modification fantasy involving newly visible horns.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_illusory_multiple_tails",
      "label": "Illusory multiple tails",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "Additional tails appear in a clearly magical or simulated body-design fantasy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_adaptive_wing_expansion",
      "label": "Adaptive wing expansion",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A winged adult's silhouette changes through reversible fantasy anatomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_mirror_body_mimicry",
      "label": "Mirror-body mimicry",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "Two consenting adults intentionally match appearances in a reversible fiction.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_extra_limb_choreography",
      "label": "Extra-limb choreography",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "An adult with additional arms or appendages explores deliberately coordinated touch and gestures.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_linked_avatar_body_duet",
      "label": "Linked-avatar body duet",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "One person operates two clearly controlled fictional avatars without claiming a second independent person's consent.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_symbiotic_outfit_transformation",
      "label": "Symbiotic outfit transformation",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "Sentient-safe clothing changes shape in response to negotiated aesthetic choices.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_elemental_phase_shift_body",
      "label": "Elemental phase-shift body",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A stable adult form alternates between material and elemental appearances without harm.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_seasonal_metamorphosis_ritual",
      "label": "Seasonal metamorphosis ritual",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A consensual change in form tied to an invented species' seasonal symbolism.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_true_form_reveal_ceremony",
      "label": "True-form reveal ceremony",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A person intentionally reveals a previously private, established nonhuman form.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_soft_body_enveloping_illusion",
      "label": "Soft-body enveloping illusion",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A reversible fantasy of a soft-bodied figure enclosing another adult without trapping them.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_crystal_form_metamorphosis",
      "label": "Crystal-form metamorphosis",
      "category": "metamorphosis_mutable_bodies",
      "kind": "negotiated_adult_kink",
      "description": "A reversible transformation into gemstone-like anatomy with no injury.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "spacefaring_sf",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "shapeshifter",
        "slime_person",
        "android",
        "changeling"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_star_pupil_hypnotic_aesthetics",
      "label": "Star-pupil hypnotic aesthetics",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "An uncanny-eyed adult uses a theatrical gaze without actual mind control.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_mutual_haunting_ritual",
      "label": "Mutual haunting ritual",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "Two adult spirits or visitors deliberately appear in one another's spaces by invitation.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_shadow_host_partnership",
      "label": "Shadow-host partnership",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A person and a distinct sentient shadow negotiate a shared fictional bond.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_echo_voice_duet",
      "label": "Echo-voice duet",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "Multiple resonant voices create a consensual otherworldly sensory effect.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_uncanny_mirror_courtship",
      "label": "Uncanny mirror courtship",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A fictional reflection answers as an independently consenting adult counterpart.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_forbidden_text_pact",
      "label": "Forbidden-text pact",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A romance ritual based on a discovered occult book, with no compulsory obligations.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_void_door_closeness",
      "label": "Void-door closeness",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A partner's body opens a reversible, harmless portal-like visual illusion.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_living_constellation_scars_fiction",
      "label": "Living constellation scars fiction",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "Star patterns appear on an adult's skin as an agreed magical aesthetic; no injury is depicted.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_sentient_mask_exchange",
      "label": "Sentient mask exchange",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "Independently consenting adult mask-spirits participate in an identity-themed ceremony.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_whispering_wall_exchange",
      "label": "Whispering-wall exchange",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A private space echoes chosen affectionate phrases as an uncanny setting mechanic.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_phantom_silhouette_flirting",
      "label": "Phantom-silhouette flirting",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A ghostly adult's outline appears and fades during consensual teasing.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_adult_monster_under_the_bed_inversion",
      "label": "Adult monster-under-the-bed inversion",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "A playful fictional reversal of a spooky trope between clearly adult characters.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_shared_dream_labyrinth",
      "label": "Shared dream labyrinth",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "Two adults knowingly enter a consensual dream puzzle as a romantic fantasy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_second_shadow_ritual",
      "label": "Second-shadow ritual",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "An adult temporarily displays a second responsive shadow under explicit fictional rules.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_unreal_anatomy_appreciation",
      "label": "Unreal anatomy appreciation",
      "category": "eldritch_uncanny",
      "kind": "negotiated_adult_kink",
      "description": "Attraction to impossible but coherent adult fictional anatomy, without automatically assigning interests.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "gothic_romance",
        "mythic_folklore",
        "celestial_astral"
      ],
      "illustrative_species_ids": [
        "ghost",
        "shapeshifter",
        "silicon_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_oviposition_themed_fiction",
      "label": "Oviposition-themed fiction",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A non-graphic fictional egg-laying fantasy involving only independently consenting adult sentient characters.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_adult_breeding_fantasy",
      "label": "Adult breeding fantasy",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A private reproductive-themed fictional preference; not an assumption of actual pregnancy, fertility or agreement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_voluntary_heat_cycle_roleplay",
      "label": "Voluntary heat-cycle roleplay",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "An adult opts into a fictional species-cycle scenario without any real loss of consent.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_voluntary_rut_cycle_roleplay",
      "label": "Voluntary rut-cycle roleplay",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "An adult opts into a fictional heightened-drive trope without overriding an actual refusal.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_omegaverse_social_dynamics_fiction",
      "label": "Omegaverse social-dynamics fiction",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A/B/O-inspired fictional adult roles treated as explicitly chosen social play, not biological destiny or coercion.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_egg_guarding_bond_ritual",
      "label": "Egg-guarding bond ritual",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "Two adults explore an invented species' protective symbolic egg-guarding courtship.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_mating_display_choreography",
      "label": "Mating-display choreography",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A consenting adult performs a non-graphic fictional display using color, posture or movement.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_molting_season_reveal",
      "label": "Molting-season reveal",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "An adult's established shedding or molting process becomes an optional intimate symbolic moment.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_mutual_symbiote_companionship",
      "label": "Mutual symbiote companionship",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "Independently sentient adult symbiotes explicitly agree to any shared-body partnership.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_incubation_chamber_romance_fiction",
      "label": "Incubation-chamber romance fiction",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A sci-fi reproductive-themed setting fantasy with independent choice and no real bodily risk.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_courtship_pheromone_imitation",
      "label": "Courtship pheromone imitation",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A strictly simulated scent cue used only when all adults can freely decline it.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_scent_identity_exchange",
      "label": "Scent-identity exchange",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "Adult characters voluntarily share harmless scent signatures as a fictional species custom.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_hive_member_individual_dating",
      "label": "Hive-member individual dating",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A member of a collective dates as an autonomous adult, without presuming group consent.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_multi_body_individual_courtship",
      "label": "Multi-body individual courtship",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A multi-bodied sentient adult coordinates its own forms; other independent minds still require separate opt-in.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_seasonal_display_color_fantasy",
      "label": "Seasonal display-color fantasy",
      "category": "alien_biology_cycles",
      "kind": "negotiated_adult_kink",
      "description": "A fictional adult's skin or feathers change color as a chosen courtship signal.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "spacefaring_sf",
        "aquatic_civilization",
        "urban_fantasy"
      ],
      "illustrative_species_ids": [
        "alien_humanoid",
        "insectoid_alien",
        "slime_person",
        "cephalopod_alien"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "higher_guardrails",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_echolocation_courtship_codes",
      "label": "Echolocation courtship codes",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "A bat-like or alien adult uses agreed sound patterns as a flirtation ritual.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_tentacle_calligraphy_ritual",
      "label": "Tentacle calligraphy ritual",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "A tentacled adult writes private messages with a coordinated appendage.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_skin_color_conversation",
      "label": "Skin-color conversation",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "A color-changing adult expresses chosen emotions through visible patterns rather than assumed mind-reading.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_gill_frill_display",
      "label": "Gill-frill display",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An aquatic adult performs a voluntary gill or frill presentation within their own physiology.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_fin_fan_courtship",
      "label": "Fin-fan courtship",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An aquatic adult uses fin displays in a personal attraction ritual.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_shell_clasp_adornment",
      "label": "Shell-clasp adornment",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An armored or shelled adult exchanges removable ornamental clasps.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_coral_crown_ceremony",
      "label": "Coral-crown ceremony",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "Aquatic courtship jewelry or symbolic crown exchange compatible with anatomy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_feather_plume_presentation",
      "label": "Feather-plume presentation",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "A feathered adult arranges its plumage for a partner's appreciation.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_wingtip_signal_alphabet",
      "label": "Wingtip signal alphabet",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "Winged adults communicate through a private, mutually learned gesture code.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_antenna_frequency_duet",
      "label": "Antenna-frequency duet",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An insectoid adult uses established antenna senses in a consensual communication fantasy.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_aerial_catch_challenge",
      "label": "Aerial catch challenge",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "Two capable adults agree to a fictional assisted-flight trust game with no real danger.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_cocoon_to_wing_reveal",
      "label": "Cocoon-to-wing reveal",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An established adult metamorphosis is ceremonially revealed, not treated as a minor becoming adult.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_body_temperature_shimmer",
      "label": "Body-temperature shimmer",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An elemental or alien adult's surface gently shifts visible patterns based on fictional warmth cues.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_multiple_eye_focus_play",
      "label": "Multiple-eye focus play",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "An independently consenting multi-eyed adult chooses a nonhuman gaze and attention ritual.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_gravity_neutral_posture_play",
      "label": "Gravity-neutral posture play",
      "category": "strange_senses_anatomy",
      "kind": "negotiated_adult_kink",
      "description": "A fictional low-gravity environment makes unusual adult body plans comfortable in a mutually planned scene.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "aquatic_civilization",
        "spacefaring_sf",
        "medieval_high_fantasy"
      ],
      "illustrative_species_ids": [
        "mothfolk",
        "octopusfolk",
        "batfolk",
        "merfolk",
        "insectfolk"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_consent_sigil_ceremony",
      "label": "Consent-sigil ceremony",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A visible magical symbol reflects an explicitly negotiated choice and disappears when withdrawn.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_oath_bound_transformation_fiction",
      "label": "Oath-bound transformation fiction",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "An adult voluntarily chooses a reversible transformation as part of a ceremonial romance.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_borrowed_shadow_courtship",
      "label": "Borrowed-shadow courtship",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "Two consenting adults exchange harmless shadow likenesses as an occult metaphor.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_memory_echo_donation_fantasy",
      "label": "Memory-echo donation fantasy",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A person deliberately shares a chosen memory fragment, never unrestricted private history.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_moon_phase_courtship_pact",
      "label": "Moon-phase courtship pact",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "Optional rituals change by an agreed fictional lunar calendar.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_curse_and_cure_bargaining_game",
      "label": "Curse-and-cure bargaining game",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "Adults perform a fictional curse plot where any real autonomy remains intact.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_guardian_spirit_role_reversal",
      "label": "Guardian-spirit role reversal",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A protector-and-protected pairing consensually swaps roles in a supernatural story.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_spectral_touch_simulation",
      "label": "Spectral touch simulation",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A mutually chosen ghostly tactile illusion without uninvited physical contact.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_dragon_hoard_devotion_ritual",
      "label": "Dragon-hoard devotion ritual",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A draconic adult offers meaningful treasured objects as an agreed symbolic dynamic.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_fae_debt_courtship_ledger",
      "label": "Fae-debt courtship ledger",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "Playful imaginary debts are tracked and can always be canceled without penalty.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_infernal_tribunal_roleplay",
      "label": "Infernal tribunal roleplay",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A demon-court judgment scene performed with explicit adult boundaries and no genuine coercion.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_eternal_night_identity_masquerade",
      "label": "Eternal-night identity masquerade",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "Participants voluntarily conceal and reveal personas at a fictional night court.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_rune_resonance_pairing",
      "label": "Rune-resonance pairing",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "Two adults choose synchronized magical glyph patterns as a bodily aesthetic.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_prophetic_vision_invitation",
      "label": "Prophetic-vision invitation",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "One adult offers an opted-in, clearly fictional glimpse of a possible romantic future.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_relic_key_devotion_play",
      "label": "Relic-key devotion play",
      "category": "arcane_contracts_gothic",
      "kind": "negotiated_adult_kink",
      "description": "A chosen key or relic symbolizes access that remains revocable at every moment.",
      "requires_world_capabilities": [
        "fantasy_magic"
      ],
      "suggested_universe_tags": [
        "medieval_high_fantasy",
        "urban_fantasy",
        "gothic_romance",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "vampire",
        "demon",
        "fae",
        "dragonborn"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_fictional_firmware_personality_mask",
      "label": "Fictional firmware personality mask",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "An adult synthetic person voluntarily roleplays an alternate manner without losing agency.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_read_only_access_courtship",
      "label": "Read-only access courtship",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "Two adults playfully grant and revoke simulated access to harmless personal displays.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_security_clearance_flirting",
      "label": "Security-clearance flirting",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A permissions-themed dating game with negotiated boundaries and no actual account access.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_access_grant_ceremony",
      "label": "Access-grant ceremony",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A deliberately symbolic, revocable permission ritual in a virtual romance.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_neon_data_tattoo_linking",
      "label": "Neon data-tattoo linking",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "Synthetic or augmented markings glow in synchronized patterns by choice.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_emotion_codec_exchange",
      "label": "Emotion-codec exchange",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "Adults intentionally share selected fictional feelings, not uncontrolled mind access.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_interchangeable_chassis_fashion",
      "label": "Interchangeable-chassis fashion",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A synthetic adult chooses interchangeable external forms as a style fantasy.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_sensory_calibration_duet",
      "label": "Sensory calibration duet",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A synthetic adult and partner agree on comfortable simulated touch settings.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_remote_avatar_direction_fantasy",
      "label": "Remote-avatar direction fantasy",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "An adult voluntarily directs their own proxy avatar under revocable fictional rules.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_gesture_macro_affection",
      "label": "Gesture-macro affection",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A synthetic person chooses repeated signature gestures as a personal romantic habit.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_holographic_dress_code_switch",
      "label": "Holographic dress-code switch",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "Outfit appearance changes by mutual agreement through a fictional projection system.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_heartbeat_telemetry_duet",
      "label": "Heartbeat-telemetry duet",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "Adults deliberately share selected heartbeat-like signals, without continuous monitoring.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_virtual_physics_inversion",
      "label": "Virtual physics inversion",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "An opt-in digital date uses impossible body physics as a fantasy environment.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_backup_copy_reunion_fiction",
      "label": "Backup-copy reunion fiction",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A sci-fi story explores consent and identity when an independent adult copy exists.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_firewall_and_intruder_simulation",
      "label": "Firewall-and-intruder simulation",
      "category": "cyber_permissions_and_synthetic",
      "kind": "negotiated_adult_kink",
      "description": "A fully simulated cyber-intrigue scenario without actual hacking or privacy breaches.",
      "requires_world_capabilities": [
        "digital_networks"
      ],
      "suggested_universe_tags": [
        "cyberpunk",
        "spacefaring_sf"
      ],
      "illustrative_species_ids": [
        "android",
        "cyborg",
        "robot_person",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_chrono_stasis_rendezvous_fiction",
      "label": "Chrono-stasis rendezvous fiction",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "Two adults voluntarily experience an imagined pause outside ordinary time.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_parallel_self_encounter",
      "label": "Parallel-self encounter",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "Independently consenting alternate adult selves meet in a fictional multiverse.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_timeline_crossing_courtship",
      "label": "Timeline-crossing courtship",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A romance roleplay explores alternate timelines without changing actual accepted canon.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_clone_date_consent_puzzle",
      "label": "Clone-date consent puzzle",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A consenting adult's fictional copies interact only with clear separate agency where independent.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_gravity_knot_choreography",
      "label": "Gravity-knot choreography",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A pair voluntarily navigates an impossible mutual-gravity dance.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_cosmic_scale_size_fantasy",
      "label": "Cosmic-scale size fantasy",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "Adults imagine vast or tiny cosmic forms without dangerous real-world acts.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_nebula_skin_illumination",
      "label": "Nebula-skin illumination",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A celestial adult's surface displays shifting clouds of light by consent.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_wormhole_secret_door_rendezvous",
      "label": "Wormhole secret-door rendezvous",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "An imaginary shortcut connects private dates through agreed fictional portals.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_starship_quarantine_romance_fiction",
      "label": "Starship quarantine romance fiction",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A dramatic isolation scenario that never traps a real participant or removes the option to leave.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_alien_embassy_courtship_protocol",
      "label": "Alien embassy courtship protocol",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A playful formal consent and greeting ritual based on reviewed alien customs.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_dimensional_tether_symbolism",
      "label": "Dimensional-tether symbolism",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A reversible imaginary bond lets characters locate a shared fictional meeting point.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_supernova_rescue_fantasy",
      "label": "Supernova-rescue fantasy",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "Two adults perform a dramatic rescue theme without actual peril.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_orbital_oath_exchange",
      "label": "Orbital oath exchange",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "A pair exchanges revocable fictional vows during zero-gravity or orbital imagery.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_constellation_body_art_mapping",
      "label": "Constellation body-art mapping",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "Voluntary star-pattern body art expresses a private symbolic connection.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    },
    {
      "id": "v3_black_hole_horizon_encounter_fiction",
      "label": "Black-hole horizon encounter fiction",
      "category": "cosmic_multiversal",
      "kind": "negotiated_adult_kink",
      "description": "An impossible cosmic meeting serves as aesthetic fantasy rather than actual harm.",
      "requires_world_capabilities": [],
      "suggested_universe_tags": [
        "celestial_astral",
        "spacefaring_sf",
        "mythic_folklore"
      ],
      "illustrative_species_ids": [
        "celestial",
        "energy_person",
        "alien_humanoid",
        "holographic_person"
      ],
      "legacy": false,
      "private_by_default": true,
      "explicit_mutual_opt_in": true,
      "not_species_default": true,
      "requires_trait_confirmation": true,
      "intensity": "adult_explicit_opt_in",
      "safe_for_public_profile": false,
      "fictional_scenario_only": true,
      "introduced_in": "3.0-draft",
      "source_type": "catalog_example_not_character_fact"
    }
  ],
  "species_attraction_choices": [
    {
      "species_id": "human",
      "label": "Human",
      "species_family": "ordinary",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "elf",
      "label": "Elf",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dwarf",
      "label": "Dwarf",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "halfling",
      "label": "Halfling",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "gnome",
      "label": "Gnome",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "orc",
      "label": "Orc",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "half_orc",
      "label": "Half-orc",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "goblin",
      "label": "Goblin",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hobgoblin",
      "label": "Hobgoblin",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bugbear",
      "label": "Bugbear",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ogre",
      "label": "Ogre",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "troll",
      "label": "Troll",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "giant",
      "label": "Giant",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fae",
      "label": "Fae",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fairy",
      "label": "Fairy",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dryad",
      "label": "Dryad",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "nymph",
      "label": "Nymph",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "satyr",
      "label": "Satyr",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "centaur",
      "label": "Centaur",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "minotaur",
      "label": "Minotaur",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "merfolk",
      "label": "Merfolk",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "harpy",
      "label": "Harpy",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "naga",
      "label": "Naga",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lamia",
      "label": "Lamia",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dragonborn",
      "label": "Dragonborn",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "draconic_person",
      "label": "Draconic person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "kobold",
      "label": "Kobold",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lizardfolk",
      "label": "Lizardfolk",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "tiefling",
      "label": "Tiefling",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "aasimar",
      "label": "Aasimar",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "celestial",
      "label": "Celestial person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "demon",
      "label": "Demon person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "vampire",
      "label": "Vampire",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "werewolf",
      "label": "Werewolf",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "shapeshifter",
      "label": "Shapeshifter",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "changeling",
      "label": "Changeling",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "revenant",
      "label": "Revenant",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ghost",
      "label": "Ghost person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "skeleton_person",
      "label": "Skeletal person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "elemental_person",
      "label": "Elemental person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "golem",
      "label": "Golem person",
      "species_family": "fantasy",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "catfolk",
      "label": "Catfolk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "foxfolk",
      "label": "Foxfolk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "wolffolk",
      "label": "Wolffolk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "rabbitfolk",
      "label": "Rabbitfolk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "deerfolk",
      "label": "Deerfolk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bearfolk",
      "label": "Bearfolk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "avianfolk",
      "label": "Avian folk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "insectfolk",
      "label": "Insect folk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "arachnidfolk",
      "label": "Arachnid folk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "amphibianfolk",
      "label": "Amphibian folk",
      "species_family": "anthropomorphic",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "alien_humanoid",
      "label": "Alien humanoid",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "android",
      "label": "Android",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "robot_person",
      "label": "Robot person",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cyborg",
      "label": "Cyborg",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "synthetic_organic",
      "label": "Synthetic organic person",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "holographic_person",
      "label": "Holographic person",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "uplifted_person",
      "label": "Uplifted person",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "silicon_person",
      "label": "Silicon-based person",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "plant_person",
      "label": "Plant person",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "aquatic_alien",
      "label": "Aquatic alien",
      "species_family": "science fiction",
      "species_group": "Original 2026-10-16 catalog",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cat_eared_demihuman",
      "label": "Cat-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dog_eared_demihuman",
      "label": "Dog-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fox_eared_demihuman",
      "label": "Fox-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "wolf_eared_demihuman",
      "label": "Wolf-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "rabbit_eared_demihuman",
      "label": "Rabbit-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "deer_eared_demihuman",
      "label": "Deer-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "horse_eared_demihuman",
      "label": "Horse-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cow_eared_demihuman",
      "label": "Cow-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sheep_eared_demihuman",
      "label": "Sheep-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "goat_eared_demihuman",
      "label": "Goat-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mouse_eared_demihuman",
      "label": "Mouse-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "rat_eared_demihuman",
      "label": "Rat-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "squirrel_eared_demihuman",
      "label": "Squirrel-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bear_eared_demihuman",
      "label": "Bear-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "raccoon_eared_demihuman",
      "label": "Raccoon-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "otter_eared_demihuman",
      "label": "Otter-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bat_eared_demihuman",
      "label": "Bat-eared demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bird_winged_demihuman",
      "label": "Bird-winged demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "feather_crested_demihuman",
      "label": "Feather-crested demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dragon_horned_demihuman",
      "label": "Dragon-horned demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dragon_tailed_demihuman",
      "label": "Dragon-tailed demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "snake_featured_demihuman",
      "label": "Snake-featured demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "shark_featured_demihuman",
      "label": "Shark-featured demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fish_featured_demihuman",
      "label": "Fish-featured demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "axolotl_featured_demihuman",
      "label": "Axolotl-featured demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "moth_featured_demihuman",
      "label": "Moth-featured demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "spider_featured_demihuman",
      "label": "Spider-featured demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "antlered_demihuman",
      "label": "Antlered demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "winged_demihuman",
      "label": "Winged demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "scaled_demihuman",
      "label": "Scaled demi-human",
      "species_family": "demihuman",
      "species_group": "Demi-human features (humanlike body plans)",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dogfolk",
      "label": "Dogfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "jackalfolk",
      "label": "Jackalfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "coyotefolk",
      "label": "Coyotefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hyenafolk",
      "label": "Hyenafolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lionfolk",
      "label": "Lionfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "tigerfolk",
      "label": "Tigerfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "leopardfolk",
      "label": "Leopardfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cheetahfolk",
      "label": "Cheetahfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lynxfolk",
      "label": "Lynxfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "pantherfolk",
      "label": "Pantherfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "snow_leopardfolk",
      "label": "Snow leopard folk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "raccoonfolk",
      "label": "Raccoonfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "red_pandafolk",
      "label": "Red pandafolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "pandafolk",
      "label": "Pandafolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "badgerfolk",
      "label": "Badgerfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "wolverinefolk",
      "label": "Wolverinefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "weaselfolk",
      "label": "Weaselfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ferretfolk",
      "label": "Ferretfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "otterfolk",
      "label": "Otterfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "beaverfolk",
      "label": "Beaverfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sealfolk",
      "label": "Sealfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "walrusfolk",
      "label": "Walrusfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "batfolk",
      "label": "Batfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mousefolk",
      "label": "Mousefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ratfolk",
      "label": "Ratfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hamsterfolk",
      "label": "Hamsterfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "squirrelfolk",
      "label": "Squirrelfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "chipmunkfolk",
      "label": "Chipmunkfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hedgehogfolk",
      "label": "Hedgehogfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "porcupinefolk",
      "label": "Porcupinefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "capybarafolk",
      "label": "Capybarafolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "molefolk",
      "label": "Molefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "armadillofolk",
      "label": "Armadillofolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "boarfolk",
      "label": "Boarfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "pigfolk",
      "label": "Pigfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bovinefolk",
      "label": "Bovinefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sheepfolk",
      "label": "Sheepfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "goatfolk",
      "label": "Goatfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "bisonfolk",
      "label": "Bisonfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "equinefolk",
      "label": "Equinefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "zebrafolk",
      "label": "Zebrafolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "giraffefolk",
      "label": "Giraffefolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "elephantfolk",
      "label": "Elephantfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "rhinofolk",
      "label": "Rhinofolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hippofolk",
      "label": "Hippofolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "kangaroofolk",
      "label": "Kangaroofolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "koalafolk",
      "label": "Koalafolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "slothfolk",
      "label": "Slothfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lemurfolk",
      "label": "Lemurfolk",
      "species_family": "anthropomorphic",
      "species_group": "Mammalian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "crowfolk",
      "label": "Crowfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ravenfolk",
      "label": "Ravenfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "magpiefolk",
      "label": "Magpiefolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "owlfolk",
      "label": "Owlfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "eaglefolk",
      "label": "Eaglefolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hawkfolk",
      "label": "Hawkfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "falconfolk",
      "label": "Falconfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "parrotfolk",
      "label": "Parrotfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "hummingbirdfolk",
      "label": "Hummingbirdfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "swanfolk",
      "label": "Swanfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "duckfolk",
      "label": "Duckfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cranefolk",
      "label": "Cranefolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "flamingofolk",
      "label": "Flamingofolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "penguinfolk",
      "label": "Penguinfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "peacockfolk",
      "label": "Peacockfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "vulturefolk",
      "label": "Vulturefolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ostrichfolk",
      "label": "Ostrichfolk",
      "species_family": "anthropomorphic",
      "species_group": "Avian anthropomorphic folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "snakefolk",
      "label": "Snakefolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "crocodilefolk",
      "label": "Crocodilefolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "alligatorfolk",
      "label": "Alligatorfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "turtlefolk",
      "label": "Turtlefolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "tortoisefolk",
      "label": "Tortoisefolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "geckofolk",
      "label": "Geckofolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "chameleonfolk",
      "label": "Chameleonfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "iguanafolk",
      "label": "Iguanafolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "monitorfolk",
      "label": "Monitorfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "salamanderfolk",
      "label": "Salamanderfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "newtfolk",
      "label": "Newtfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "axolotlfolk",
      "label": "Axolotlfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "frogfolk",
      "label": "Frogfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "toadfolk",
      "label": "Toadfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fishfolk",
      "label": "Fishfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sharkfolk",
      "label": "Sharkfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "rayfolk",
      "label": "Rayfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dolphinfolk",
      "label": "Dolphinfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "whalefolk",
      "label": "Whalefolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "octopusfolk",
      "label": "Octopusfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "squidfolk",
      "label": "Squidfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "jellyfishfolk",
      "label": "Jellyfishfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "eelfolk",
      "label": "Eelfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "seahorsefolk",
      "label": "Seahorsefolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "anglerfishfolk",
      "label": "Anglerfishfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "crabfolk",
      "label": "Crabfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lobsterfolk",
      "label": "Lobsterfolk",
      "species_family": "anthropomorphic",
      "species_group": "Reptilian, amphibious, and marine folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mothfolk",
      "label": "Mothfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "butterflyfolk",
      "label": "Butterflyfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "beetlefolk",
      "label": "Beetlefolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fireflyfolk",
      "label": "Fireflyfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "beefolk",
      "label": "Beefolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "waspfolk",
      "label": "Waspfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "antfolk",
      "label": "Antfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mantisfolk",
      "label": "Mantisfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dragonflyfolk",
      "label": "Dragonflyfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cicadafolk",
      "label": "Cicadafolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "grasshopperfolk",
      "label": "Grasshopperfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cricketfolk",
      "label": "Cricketfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "termitefolk",
      "label": "Termitefolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "stick_insectfolk",
      "label": "Stick insect folk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "scorpionfolk",
      "label": "Scorpionfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "spiderfolk",
      "label": "Spiderfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "centipedefolk",
      "label": "Centipedefolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "pillbugfolk",
      "label": "Pillbugfolk",
      "species_family": "anthropomorphic",
      "species_group": "Insectoid and other arthropod folk",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "kitsune_person",
      "label": "Kitsune person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "tanuki_person",
      "label": "Tanuki person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "oni_person",
      "label": "Oni person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "tengu_person",
      "label": "Tengu person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "kappa_person",
      "label": "Kappa person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "selkie_person",
      "label": "Selkie person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "kelpie_person",
      "label": "Kelpie person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "banshee_person",
      "label": "Banshee person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "dullahan_person",
      "label": "Dullahan person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "djinn_person",
      "label": "Djinn person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ifrit_person",
      "label": "Ifrit person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "valkyrie_person",
      "label": "Valkyrie person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "siren_person",
      "label": "Siren person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sphinx_person",
      "label": "Sphinx person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "alraune_person",
      "label": "Alraune person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "leshy_person",
      "label": "Leshy person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "rusalka_person",
      "label": "Rusalka person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "gargoyle_person",
      "label": "Gargoyle person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cyclops_person",
      "label": "Cyclops person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "phoenix_person",
      "label": "Phoenix person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "griffinfolk",
      "label": "Griffinfolk",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "unicorn_person",
      "label": "Unicorn person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "kirin_person",
      "label": "Kirin person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "yeti_person",
      "label": "Yeti person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sasquatch_person",
      "label": "Sasquatch person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "imp_person",
      "label": "Imp person",
      "species_family": "fantasy",
      "species_group": "Mythic and folklore-based archetypes",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "slime_person",
      "label": "Slime person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "living_ink_person",
      "label": "Living ink person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fungal_person",
      "label": "Fungal person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mycelial_person",
      "label": "Mycelial person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "moss_person",
      "label": "Moss person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "vine_person",
      "label": "Vine person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "flower_person",
      "label": "Flower person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cactus_person",
      "label": "Cactus person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "treefolk",
      "label": "Treefolk",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "lichen_person",
      "label": "Lichen person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "coral_person",
      "label": "Coral person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "porcelain_doll_person",
      "label": "Porcelain doll person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cloth_doll_person",
      "label": "Cloth doll person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "wooden_doll_person",
      "label": "Wooden doll person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "paper_construct_person",
      "label": "Paper construct person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "clockwork_person",
      "label": "Clockwork person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "crystal_person",
      "label": "Crystal person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "glass_person",
      "label": "Glass person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "living_armor_person",
      "label": "Living armor person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mimic_person",
      "label": "Mimic person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "puppet_person",
      "label": "Puppet person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "flame_person",
      "label": "Flame person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "water_elemental_person",
      "label": "Water elemental person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "air_elemental_person",
      "label": "Air elemental person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ice_elemental_person",
      "label": "Ice elemental person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "shadow_person",
      "label": "Shadow person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "light_person",
      "label": "Light person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "storm_person",
      "label": "Storm person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "sand_person",
      "label": "Sand person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "smoke_person",
      "label": "Smoke person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "ash_person",
      "label": "Ash person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "wax_person",
      "label": "Wax person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "stone_elemental_person",
      "label": "Stone elemental person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "salt_person",
      "label": "Salt person",
      "species_family": "fantasy",
      "species_group": "Botanical, elemental, and constructed people",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "energy_person",
      "label": "Energy person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "plasma_person",
      "label": "Plasma person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "gas_person",
      "label": "Gas person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "swarm_person",
      "label": "Swarm person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "nanite_person",
      "label": "Nanite person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "distributed_ai_person",
      "label": "Distributed AI person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "biomechanical_person",
      "label": "Biomechanical person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "crystalline_alien",
      "label": "Crystalline alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "arthropod_alien",
      "label": "Arthropod alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "cephalopod_alien",
      "label": "Cephalopod alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "avian_alien",
      "label": "Avian alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "reptilian_alien",
      "label": "Reptilian alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "insectoid_alien",
      "label": "Insectoid alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "shapeshifting_alien",
      "label": "Shapeshifting alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "photosynthetic_alien",
      "label": "Photosynthetic alien",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "space_adapted_human",
      "label": "Space-adapted human",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "vatgrown_person",
      "label": "Vat-grown person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "clone_person",
      "label": "Clone person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "virtual_avatar_person",
      "label": "Virtual avatar person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "modular_robot_person",
      "label": "Modular robot person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "soft_robot_person",
      "label": "Soft robot person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "symbiotic_person",
      "label": "Symbiotic person",
      "species_family": "science fiction",
      "species_group": "Science-fiction and speculative bodies",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "half_elf",
      "label": "Half-elf",
      "species_family": "heritage",
      "species_group": "Mixed heritage templates",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "half_dwarf",
      "label": "Half-dwarf",
      "species_family": "heritage",
      "species_group": "Mixed heritage templates",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "half_giant",
      "label": "Half-giant",
      "species_family": "heritage",
      "species_group": "Mixed heritage templates",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "fae_descended_person",
      "label": "Fae-descended person",
      "species_family": "heritage",
      "species_group": "Mixed heritage templates",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "human_alien_hybrid",
      "label": "Human–alien hybrid",
      "species_family": "heritage",
      "species_group": "Mixed heritage templates",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    },
    {
      "species_id": "mixed_species_person",
      "label": "Mixed-species person",
      "species_family": "heritage",
      "species_group": "Mixed heritage templates",
      "selected_by_default": false,
      "private_by_default": true,
      "is_a_kink_by_itself": false
    }
  ],
  "species_illustration_index": {
    "human": {
      "species_name": "Human",
      "possible_related_tag_ids": [
        "scent_and_fragrance_preference",
        "immortal_mortal_romance",
        "prosthetic_style_romance"
      ]
    },
    "elf": {
      "species_name": "Elf",
      "possible_related_tag_ids": [
        "pointed_ear_appreciation",
        "consensual_ear_touch",
        "immortal_mortal_romance"
      ]
    },
    "dwarf": {
      "species_name": "Dwarf",
      "possible_related_tag_ids": []
    },
    "halfling": {
      "species_name": "Halfling",
      "possible_related_tag_ids": [
        "size_difference_affection",
        "rp_size_play_fantasy"
      ]
    },
    "gnome": {
      "species_name": "Gnome",
      "possible_related_tag_ids": [
        "size_difference_affection",
        "rp_tiny_adult_dynamic"
      ]
    },
    "orc": {
      "species_name": "Orc",
      "possible_related_tag_ids": []
    },
    "half_orc": {
      "species_name": "Half-orc",
      "possible_related_tag_ids": [
        "pointed_ear_appreciation"
      ]
    },
    "goblin": {
      "species_name": "Goblin",
      "possible_related_tag_ids": [
        "pointed_ear_appreciation"
      ]
    },
    "hobgoblin": {
      "species_name": "Hobgoblin",
      "possible_related_tag_ids": [
        "pointed_ear_appreciation"
      ]
    },
    "bugbear": {
      "species_name": "Bugbear",
      "possible_related_tag_ids": []
    },
    "ogre": {
      "species_name": "Ogre",
      "possible_related_tag_ids": [
        "size_difference_affection"
      ]
    },
    "troll": {
      "species_name": "Troll",
      "possible_related_tag_ids": []
    },
    "giant": {
      "species_name": "Giant",
      "possible_related_tag_ids": [
        "size_difference_affection",
        "rp_size_play_fantasy",
        "rp_giant_person_dynamic"
      ]
    },
    "fae": {
      "species_name": "Fae",
      "possible_related_tag_ids": [
        "fae_name_play",
        "fae_bargain_roleplay",
        "rp_wing_enclosure_fantasy",
        "rp_fae_true_name_drama",
        "rp_reversible_soul_bond_fantasy",
        "rp_temptation_without_compulsion",
        "rp_magical_mirror_double",
        "rp_fae_winter_court_bargain"
      ]
    },
    "fairy": {
      "species_name": "Fairy",
      "possible_related_tag_ids": [
        "size_difference_affection",
        "fae_name_play",
        "fae_bargain_roleplay",
        "rp_tiny_adult_dynamic",
        "rp_fae_true_name_drama"
      ]
    },
    "dryad": {
      "species_name": "Dryad",
      "possible_related_tag_ids": [
        "botanical_bloom_aesthetic",
        "solarpunk_garden_romance",
        "rp_living_vine_restraint_fantasy"
      ]
    },
    "nymph": {
      "species_name": "Nymph",
      "possible_related_tag_ids": []
    },
    "satyr": {
      "species_name": "Satyr",
      "possible_related_tag_ids": [
        "horn_appreciation",
        "hooves_aesthetic"
      ]
    },
    "centaur": {
      "species_name": "Centaur",
      "possible_related_tag_ids": [
        "tail_appreciation",
        "hooves_aesthetic",
        "centaur_body_aware_affection"
      ]
    },
    "minotaur": {
      "species_name": "Minotaur",
      "possible_related_tag_ids": [
        "horn_appreciation",
        "consensual_horn_decoration",
        "rp_horns_and_control_fantasy"
      ]
    },
    "merfolk": {
      "species_name": "Merfolk",
      "possible_related_tag_ids": [
        "tail_appreciation",
        "fin_gill_aesthetic",
        "consensual_tail_contact",
        "water_compatible_affection",
        "underwater_bioluminescent_dates",
        "rp_aquatic_body_plan_intimacy",
        "rp_undersea_sovereign_fantasy",
        "rp_deep_ocean_bioluminescent_ritual"
      ]
    },
    "harpy": {
      "species_name": "Harpy",
      "possible_related_tag_ids": [
        "wing_appreciation",
        "feather_plumage_aesthetic",
        "consensual_wing_care",
        "consensual_feather_grooming",
        "wing_span_space_needs",
        "legacy_wing_aware_affection",
        "rp_wing_enclosure_fantasy",
        "rp_feather_molt_symbolism",
        "rp_nesting_ritual_fantasy"
      ]
    },
    "naga": {
      "species_name": "Naga",
      "possible_related_tag_ids": [
        "serpentine_body_cuddling",
        "rp_coiling_roleplay",
        "rp_scale_touch_fixation",
        "rp_serpentine_dance_ritual"
      ]
    },
    "lamia": {
      "species_name": "Lamia",
      "possible_related_tag_ids": [
        "serpentine_body_cuddling",
        "rp_coiling_roleplay",
        "rp_serpentine_dance_ritual"
      ]
    },
    "dragonborn": {
      "species_name": "Dragonborn",
      "possible_related_tag_ids": [
        "scale_pattern_aesthetic",
        "fang_smile_appreciation",
        "claw_nail_aesthetic",
        "scale_safe_touch",
        "claw_safe_handholding",
        "negotiated_fang_roleplay",
        "draconic_gift_courtship",
        "legacy_scale_and_nonhuman_surface_appreciation",
        "rp_claw_themed_play",
        "rp_tail_guided_flirting",
        "rp_scale_touch_fixation",
        "rp_true_form_reveal_fantasy",
        "rp_nesting_ritual_fantasy",
        "rp_dragon_claim_roleplay",
        "rp_knight_and_dragon_courtship"
      ]
    },
    "draconic_person": {
      "species_name": "Draconic person",
      "possible_related_tag_ids": [
        "draconic_gift_courtship",
        "rp_dragon_claim_roleplay",
        "rp_knight_and_dragon_courtship"
      ]
    },
    "kobold": {
      "species_name": "Kobold",
      "possible_related_tag_ids": [
        "tail_appreciation",
        "scale_pattern_aesthetic",
        "consensual_tail_contact",
        "scale_safe_touch",
        "negotiated_fang_roleplay",
        "draconic_gift_courtship"
      ]
    },
    "lizardfolk": {
      "species_name": "Lizardfolk",
      "possible_related_tag_ids": [
        "tail_appreciation",
        "scale_pattern_aesthetic",
        "claw_nail_aesthetic",
        "scale_safe_touch",
        "claw_safe_handholding",
        "legacy_scale_and_nonhuman_surface_appreciation",
        "rp_scale_touch_fixation"
      ]
    },
    "tiefling": {
      "species_name": "Tiefling",
      "possible_related_tag_ids": [
        "horn_appreciation",
        "consensual_horn_decoration",
        "legacy_horn_appreciation",
        "rp_horns_and_control_fantasy",
        "rp_demon_contract_romance"
      ]
    },
    "aasimar": {
      "species_name": "Aasimar",
      "possible_related_tag_ids": [
        "celestial_sigils_romance",
        "celestial_constellation_letters"
      ]
    },
    "celestial": {
      "species_name": "Celestial person",
      "possible_related_tag_ids": [
        "celestial_sigils_romance",
        "celestial_constellation_letters",
        "rp_reversible_soul_bond_fantasy",
        "rp_sacred_versus_profane_rivals",
        "rp_celestial_oathbreakers"
      ]
    },
    "demon": {
      "species_name": "Demon person",
      "possible_related_tag_ids": [
        "rp_true_form_reveal_fantasy",
        "rp_living_shadow_embrace",
        "rp_blood_oath_symbolism",
        "rp_demon_contract_romance",
        "rp_possession_themed_roleplay",
        "rp_ritual_summoning_fantasy",
        "rp_sacred_versus_profane_rivals",
        "rp_temptation_without_compulsion",
        "rp_celestial_oathbreakers"
      ]
    },
    "vampire": {
      "species_name": "Vampire",
      "possible_related_tag_ids": [
        "fang_smile_appreciation",
        "vampire_romance_aesthetic",
        "negotiated_fang_roleplay",
        "gothic_masquerade",
        "immortal_mortal_romance",
        "rp_fang_themed_play",
        "rp_vampire_thrall_roleplay",
        "rp_blood_oath_symbolism",
        "rp_monster_hunter_and_monster"
      ]
    },
    "werewolf": {
      "species_name": "Werewolf",
      "possible_related_tag_ids": [
        "fang_smile_appreciation",
        "shape_stable_affection",
        "moonlit_courtship",
        "shifter_form_admiration",
        "shifter_identity_trust",
        "rp_partial_transformation_roleplay",
        "rp_monster_hunter_and_monster",
        "rp_moonlit_pack_hierarchy_roleplay"
      ]
    },
    "shapeshifter": {
      "species_name": "Shapeshifter",
      "possible_related_tag_ids": [
        "shape_stable_affection",
        "moonlit_courtship",
        "shifter_form_admiration",
        "shifter_identity_trust",
        "rp_transformation_fascination",
        "rp_partial_transformation_roleplay",
        "rp_dual_form_date_fantasy",
        "rp_magical_mirror_double"
      ]
    },
    "changeling": {
      "species_name": "Changeling",
      "possible_related_tag_ids": [
        "shape_stable_affection",
        "shifter_form_admiration",
        "shifter_identity_trust",
        "rp_transformation_fascination",
        "rp_dual_form_date_fantasy"
      ]
    },
    "revenant": {
      "species_name": "Revenant",
      "possible_related_tag_ids": [
        "spirit_dance",
        "gothic_masquerade",
        "immortal_mortal_romance",
        "rp_necromancer_and_revenant_romance",
        "rp_phantom_ballroom"
      ]
    },
    "ghost": {
      "species_name": "Ghost person",
      "possible_related_tag_ids": [
        "spirit_dance",
        "gothic_masquerade",
        "rp_living_shadow_embrace",
        "rp_possession_themed_roleplay",
        "rp_phantom_ballroom",
        "rp_astral_projection_rendezvous"
      ]
    },
    "skeleton_person": {
      "species_name": "Skeletal person",
      "possible_related_tag_ids": [
        "rp_necromancer_and_revenant_romance"
      ]
    },
    "elemental_person": {
      "species_name": "Elemental person",
      "possible_related_tag_ids": [
        "flame_light_aesthetic",
        "elemental_aura_admiration",
        "rp_elemental_heat_illusion",
        "rp_ritual_summoning_fantasy"
      ]
    },
    "golem": {
      "species_name": "Golem person",
      "possible_related_tag_ids": [
        "porcelain_clockwork_aesthetic",
        "steampunk_clockwork_aesthetic",
        "rp_living_armor_closeness",
        "rp_living_statue_awakening"
      ]
    },
    "catfolk": {
      "species_name": "Catfolk",
      "possible_related_tag_ids": [
        "soft_ear_appreciation",
        "tail_appreciation",
        "fur_texture_aesthetic",
        "claw_nail_aesthetic",
        "muzzle_face_appreciation",
        "whisker_aesthetic",
        "consensual_ear_touch",
        "consensual_tail_contact",
        "consensual_fur_grooming",
        "claw_safe_handholding",
        "nonhuman_surface_sensation",
        "scent_and_fragrance_preference",
        "legacy_tail_aware_affection",
        "rp_claw_themed_play",
        "rp_tail_guided_flirting",
        "rp_living_fur_sensory_play"
      ]
    },
    "foxfolk": {
      "species_name": "Foxfolk",
      "possible_related_tag_ids": [
        "soft_ear_appreciation",
        "tail_appreciation",
        "fur_texture_aesthetic",
        "muzzle_face_appreciation",
        "consensual_ear_touch",
        "consensual_tail_contact",
        "consensual_fur_grooming",
        "scent_and_fragrance_preference",
        "legacy_tail_aware_affection",
        "rp_tail_guided_flirting",
        "rp_living_fur_sensory_play"
      ]
    },
    "wolffolk": {
      "species_name": "Wolffolk",
      "possible_related_tag_ids": [
        "fur_texture_aesthetic",
        "fang_smile_appreciation",
        "muzzle_face_appreciation",
        "consensual_fur_grooming",
        "moonlit_courtship",
        "rp_fang_themed_play",
        "rp_living_fur_sensory_play",
        "rp_scent_signal_courtship",
        "rp_moonlit_pack_hierarchy_roleplay"
      ]
    },
    "rabbitfolk": {
      "species_name": "Rabbitfolk",
      "possible_related_tag_ids": [
        "fur_texture_aesthetic"
      ]
    },
    "deerfolk": {
      "species_name": "Deerfolk",
      "possible_related_tag_ids": [
        "antler_appreciation"
      ]
    },
    "bearfolk": {
      "species_name": "Bearfolk",
      "possible_related_tag_ids": [
        "consensual_fur_grooming"
      ]
    },
    "avianfolk": {
      "species_name": "Avian folk",
      "possible_related_tag_ids": [
        "wing_appreciation",
        "feather_plumage_aesthetic",
        "consensual_wing_care",
        "consensual_feather_grooming",
        "wing_span_space_needs",
        "rp_wing_enclosure_fantasy",
        "rp_feather_molt_symbolism"
      ]
    },
    "insectfolk": {
      "species_name": "Insect folk",
      "possible_related_tag_ids": [
        "antenna_aesthetic",
        "nonhuman_eye_aesthetic",
        "antenna_safe_touch",
        "rp_multiple_arm_closeness",
        "rp_antenna_sensory_fantasy",
        "rp_exoskeleton_appreciation"
      ]
    },
    "arachnidfolk": {
      "species_name": "Arachnid folk",
      "possible_related_tag_ids": [
        "shell_carapace_aesthetic",
        "nonhuman_eye_aesthetic",
        "multiple_arm_embraces",
        "rp_multiple_arm_closeness",
        "rp_exoskeleton_appreciation"
      ]
    },
    "amphibianfolk": {
      "species_name": "Amphibian folk",
      "possible_related_tag_ids": []
    },
    "alien_humanoid": {
      "species_name": "Alien humanoid",
      "possible_related_tag_ids": [
        "nonhuman_eye_aesthetic",
        "alien_sensory_compatibility",
        "interstellar_language_flirting",
        "rp_scent_signal_courtship",
        "rp_alien_mating_ritual_fiction",
        "rp_pheromone_fantasy_simulation",
        "rp_multi_limb_alien_embrace",
        "rp_bio_engineered_trait_fantasy"
      ]
    },
    "android": {
      "species_name": "Android",
      "possible_related_tag_ids": [
        "nonhuman_eye_aesthetic",
        "synthetic_design_aesthetic",
        "synthetic_touch_boundaries",
        "immortal_mortal_romance",
        "private_vr_date",
        "synthetic_voice_aesthetic",
        "robotic_gesture_romance",
        "rp_synthetic_texture_preference",
        "rp_modular_body_aesthetics",
        "rp_neural_sensation_sharing",
        "rp_simulated_obedience_subroutine",
        "rp_programmable_skin_aesthetics",
        "rp_synthetic_voice_command_play",
        "rp_cybernetic_collar_symbolism",
        "rp_sensation_synchronization_ritual",
        "rp_modular_form_reveal",
        "rp_ai_and_human_forbidden_romance"
      ]
    },
    "robot_person": {
      "species_name": "Robot person",
      "possible_related_tag_ids": [
        "synthetic_design_aesthetic",
        "synthetic_touch_boundaries",
        "synthetic_voice_aesthetic",
        "modular_body_styling",
        "robotic_gesture_romance",
        "rp_living_armor_closeness",
        "rp_synthetic_texture_preference",
        "rp_modular_body_aesthetics",
        "rp_simulated_obedience_subroutine",
        "rp_synthetic_voice_command_play",
        "rp_modular_form_reveal",
        "rp_ai_and_human_forbidden_romance",
        "rp_clockwork_ballroom_fantasy"
      ]
    },
    "cyborg": {
      "species_name": "Cyborg",
      "possible_related_tag_ids": [
        "synthetic_touch_boundaries",
        "augmentation_aesthetic",
        "prosthetic_style_romance",
        "biomechanical_pattern_aesthetic",
        "steampunk_clockwork_aesthetic",
        "rp_neural_sensation_sharing",
        "rp_cybernetic_collar_symbolism",
        "rp_sensation_synchronization_ritual"
      ]
    },
    "synthetic_organic": {
      "species_name": "Synthetic organic person",
      "possible_related_tag_ids": [
        "nonhuman_surface_sensation",
        "synthetic_touch_boundaries",
        "biomechanical_pattern_aesthetic",
        "rp_symbiotic_partner_courtship",
        "rp_programmable_skin_aesthetics",
        "rp_bio_engineered_trait_fantasy"
      ]
    },
    "holographic_person": {
      "species_name": "Holographic person",
      "possible_related_tag_ids": [
        "private_vr_date",
        "avatar_style_roleplay",
        "hologram_date_projection",
        "rp_hologram_duplication_fantasy",
        "rp_astral_projection_rendezvous"
      ]
    },
    "uplifted_person": {
      "species_name": "Uplifted person",
      "possible_related_tag_ids": []
    },
    "silicon_person": {
      "species_name": "Silicon-based person",
      "possible_related_tag_ids": [
        "crystal_mineral_aesthetic",
        "rp_crystal_resonance_play"
      ]
    },
    "plant_person": {
      "species_name": "Plant person",
      "possible_related_tag_ids": [
        "botanical_bloom_aesthetic",
        "solarpunk_garden_romance",
        "rp_living_vine_restraint_fantasy"
      ]
    },
    "aquatic_alien": {
      "species_name": "Aquatic alien",
      "possible_related_tag_ids": [
        "fin_gill_aesthetic",
        "water_compatible_affection",
        "alien_sensory_compatibility",
        "underwater_bioluminescent_dates",
        "rp_bioluminescent_courtship_code",
        "rp_aquatic_body_plan_intimacy",
        "rp_alien_mating_ritual_fiction",
        "rp_deep_ocean_bioluminescent_ritual"
      ]
    },
    "cat_eared_demihuman": {
      "species_name": "Cat-eared demi-human",
      "possible_related_tag_ids": [
        "soft_ear_appreciation",
        "consensual_ear_touch"
      ]
    },
    "dog_eared_demihuman": {
      "species_name": "Dog-eared demi-human",
      "possible_related_tag_ids": []
    },
    "fox_eared_demihuman": {
      "species_name": "Fox-eared demi-human",
      "possible_related_tag_ids": []
    },
    "wolf_eared_demihuman": {
      "species_name": "Wolf-eared demi-human",
      "possible_related_tag_ids": [
        "soft_ear_appreciation"
      ]
    },
    "rabbit_eared_demihuman": {
      "species_name": "Rabbit-eared demi-human",
      "possible_related_tag_ids": [
        "soft_ear_appreciation",
        "consensual_ear_touch"
      ]
    },
    "deer_eared_demihuman": {
      "species_name": "Deer-eared demi-human",
      "possible_related_tag_ids": []
    },
    "horse_eared_demihuman": {
      "species_name": "Horse-eared demi-human",
      "possible_related_tag_ids": []
    },
    "cow_eared_demihuman": {
      "species_name": "Cow-eared demi-human",
      "possible_related_tag_ids": []
    },
    "sheep_eared_demihuman": {
      "species_name": "Sheep-eared demi-human",
      "possible_related_tag_ids": []
    },
    "goat_eared_demihuman": {
      "species_name": "Goat-eared demi-human",
      "possible_related_tag_ids": []
    },
    "mouse_eared_demihuman": {
      "species_name": "Mouse-eared demi-human",
      "possible_related_tag_ids": []
    },
    "rat_eared_demihuman": {
      "species_name": "Rat-eared demi-human",
      "possible_related_tag_ids": []
    },
    "squirrel_eared_demihuman": {
      "species_name": "Squirrel-eared demi-human",
      "possible_related_tag_ids": []
    },
    "bear_eared_demihuman": {
      "species_name": "Bear-eared demi-human",
      "possible_related_tag_ids": []
    },
    "raccoon_eared_demihuman": {
      "species_name": "Raccoon-eared demi-human",
      "possible_related_tag_ids": []
    },
    "otter_eared_demihuman": {
      "species_name": "Otter-eared demi-human",
      "possible_related_tag_ids": []
    },
    "bat_eared_demihuman": {
      "species_name": "Bat-eared demi-human",
      "possible_related_tag_ids": []
    },
    "bird_winged_demihuman": {
      "species_name": "Bird-winged demi-human",
      "possible_related_tag_ids": [
        "wing_appreciation",
        "feather_plumage_aesthetic"
      ]
    },
    "feather_crested_demihuman": {
      "species_name": "Feather-crested demi-human",
      "possible_related_tag_ids": []
    },
    "dragon_horned_demihuman": {
      "species_name": "Dragon-horned demi-human",
      "possible_related_tag_ids": [
        "horn_appreciation",
        "consensual_horn_decoration",
        "legacy_horn_appreciation"
      ]
    },
    "dragon_tailed_demihuman": {
      "species_name": "Dragon-tailed demi-human",
      "possible_related_tag_ids": [
        "tail_appreciation",
        "consensual_tail_contact",
        "legacy_tail_aware_affection"
      ]
    },
    "snake_featured_demihuman": {
      "species_name": "Snake-featured demi-human",
      "possible_related_tag_ids": []
    },
    "shark_featured_demihuman": {
      "species_name": "Shark-featured demi-human",
      "possible_related_tag_ids": []
    },
    "fish_featured_demihuman": {
      "species_name": "Fish-featured demi-human",
      "possible_related_tag_ids": []
    },
    "axolotl_featured_demihuman": {
      "species_name": "Axolotl-featured demi-human",
      "possible_related_tag_ids": []
    },
    "moth_featured_demihuman": {
      "species_name": "Moth-featured demi-human",
      "possible_related_tag_ids": []
    },
    "spider_featured_demihuman": {
      "species_name": "Spider-featured demi-human",
      "possible_related_tag_ids": []
    },
    "antlered_demihuman": {
      "species_name": "Antlered demi-human",
      "possible_related_tag_ids": [
        "antler_appreciation"
      ]
    },
    "winged_demihuman": {
      "species_name": "Winged demi-human",
      "possible_related_tag_ids": [
        "wing_appreciation",
        "consensual_wing_care",
        "wing_span_space_needs",
        "legacy_wing_aware_affection"
      ]
    },
    "scaled_demihuman": {
      "species_name": "Scaled demi-human",
      "possible_related_tag_ids": [
        "scale_pattern_aesthetic",
        "scale_safe_touch"
      ]
    },
    "dogfolk": {
      "species_name": "Dogfolk",
      "possible_related_tag_ids": [
        "soft_ear_appreciation",
        "muzzle_face_appreciation"
      ]
    },
    "jackalfolk": {
      "species_name": "Jackalfolk",
      "possible_related_tag_ids": []
    },
    "coyotefolk": {
      "species_name": "Coyotefolk",
      "possible_related_tag_ids": []
    },
    "hyenafolk": {
      "species_name": "Hyenafolk",
      "possible_related_tag_ids": []
    },
    "lionfolk": {
      "species_name": "Lionfolk",
      "possible_related_tag_ids": []
    },
    "tigerfolk": {
      "species_name": "Tigerfolk",
      "possible_related_tag_ids": []
    },
    "leopardfolk": {
      "species_name": "Leopardfolk",
      "possible_related_tag_ids": []
    },
    "cheetahfolk": {
      "species_name": "Cheetahfolk",
      "possible_related_tag_ids": []
    },
    "lynxfolk": {
      "species_name": "Lynxfolk",
      "possible_related_tag_ids": []
    },
    "pantherfolk": {
      "species_name": "Pantherfolk",
      "possible_related_tag_ids": []
    },
    "snow_leopardfolk": {
      "species_name": "Snow leopard folk",
      "possible_related_tag_ids": []
    },
    "raccoonfolk": {
      "species_name": "Raccoonfolk",
      "possible_related_tag_ids": []
    },
    "red_pandafolk": {
      "species_name": "Red pandafolk",
      "possible_related_tag_ids": [
        "fur_texture_aesthetic",
        "consensual_fur_grooming"
      ]
    },
    "pandafolk": {
      "species_name": "Pandafolk",
      "possible_related_tag_ids": []
    },
    "badgerfolk": {
      "species_name": "Badgerfolk",
      "possible_related_tag_ids": []
    },
    "wolverinefolk": {
      "species_name": "Wolverinefolk",
      "possible_related_tag_ids": []
    },
    "weaselfolk": {
      "species_name": "Weaselfolk",
      "possible_related_tag_ids": []
    },
    "ferretfolk": {
      "species_name": "Ferretfolk",
      "possible_related_tag_ids": []
    },
    "otterfolk": {
      "species_name": "Otterfolk",
      "possible_related_tag_ids": [
        "whisker_aesthetic"
      ]
    },
    "beaverfolk": {
      "species_name": "Beaverfolk",
      "possible_related_tag_ids": []
    },
    "sealfolk": {
      "species_name": "Sealfolk",
      "possible_related_tag_ids": []
    },
    "walrusfolk": {
      "species_name": "Walrusfolk",
      "possible_related_tag_ids": []
    },
    "batfolk": {
      "species_name": "Batfolk",
      "possible_related_tag_ids": [
        "soft_ear_appreciation",
        "wing_appreciation",
        "fur_texture_aesthetic",
        "consensual_wing_care",
        "wing_span_space_needs"
      ]
    },
    "mousefolk": {
      "species_name": "Mousefolk",
      "possible_related_tag_ids": [
        "whisker_aesthetic"
      ]
    },
    "ratfolk": {
      "species_name": "Ratfolk",
      "possible_related_tag_ids": [
        "whisker_aesthetic"
      ]
    },
    "hamsterfolk": {
      "species_name": "Hamsterfolk",
      "possible_related_tag_ids": []
    },
    "squirrelfolk": {
      "species_name": "Squirrelfolk",
      "possible_related_tag_ids": []
    },
    "chipmunkfolk": {
      "species_name": "Chipmunkfolk",
      "possible_related_tag_ids": []
    },
    "hedgehogfolk": {
      "species_name": "Hedgehogfolk",
      "possible_related_tag_ids": []
    },
    "porcupinefolk": {
      "species_name": "Porcupinefolk",
      "possible_related_tag_ids": []
    },
    "capybarafolk": {
      "species_name": "Capybarafolk",
      "possible_related_tag_ids": []
    },
    "molefolk": {
      "species_name": "Molefolk",
      "possible_related_tag_ids": []
    },
    "armadillofolk": {
      "species_name": "Armadillofolk",
      "possible_related_tag_ids": []
    },
    "boarfolk": {
      "species_name": "Boarfolk",
      "possible_related_tag_ids": []
    },
    "pigfolk": {
      "species_name": "Pigfolk",
      "possible_related_tag_ids": []
    },
    "bovinefolk": {
      "species_name": "Bovinefolk",
      "possible_related_tag_ids": [
        "hooves_aesthetic"
      ]
    },
    "sheepfolk": {
      "species_name": "Sheepfolk",
      "possible_related_tag_ids": []
    },
    "goatfolk": {
      "species_name": "Goatfolk",
      "possible_related_tag_ids": [
        "horn_appreciation",
        "hooves_aesthetic"
      ]
    },
    "bisonfolk": {
      "species_name": "Bisonfolk",
      "possible_related_tag_ids": []
    },
    "equinefolk": {
      "species_name": "Equinefolk",
      "possible_related_tag_ids": [
        "muzzle_face_appreciation",
        "hooves_aesthetic",
        "centaur_body_aware_affection"
      ]
    },
    "zebrafolk": {
      "species_name": "Zebrafolk",
      "possible_related_tag_ids": []
    },
    "giraffefolk": {
      "species_name": "Giraffefolk",
      "possible_related_tag_ids": []
    },
    "elephantfolk": {
      "species_name": "Elephantfolk",
      "possible_related_tag_ids": []
    },
    "rhinofolk": {
      "species_name": "Rhinofolk",
      "possible_related_tag_ids": []
    },
    "hippofolk": {
      "species_name": "Hippofolk",
      "possible_related_tag_ids": []
    },
    "kangaroofolk": {
      "species_name": "Kangaroofolk",
      "possible_related_tag_ids": []
    },
    "koalafolk": {
      "species_name": "Koalafolk",
      "possible_related_tag_ids": []
    },
    "slothfolk": {
      "species_name": "Slothfolk",
      "possible_related_tag_ids": []
    },
    "lemurfolk": {
      "species_name": "Lemurfolk",
      "possible_related_tag_ids": []
    },
    "crowfolk": {
      "species_name": "Crowfolk",
      "possible_related_tag_ids": [
        "feather_plumage_aesthetic"
      ]
    },
    "ravenfolk": {
      "species_name": "Ravenfolk",
      "possible_related_tag_ids": []
    },
    "magpiefolk": {
      "species_name": "Magpiefolk",
      "possible_related_tag_ids": []
    },
    "owlfolk": {
      "species_name": "Owlfolk",
      "possible_related_tag_ids": [
        "feather_plumage_aesthetic",
        "consensual_feather_grooming"
      ]
    },
    "eaglefolk": {
      "species_name": "Eaglefolk",
      "possible_related_tag_ids": []
    },
    "hawkfolk": {
      "species_name": "Hawkfolk",
      "possible_related_tag_ids": []
    },
    "falconfolk": {
      "species_name": "Falconfolk",
      "possible_related_tag_ids": []
    },
    "parrotfolk": {
      "species_name": "Parrotfolk",
      "possible_related_tag_ids": []
    },
    "hummingbirdfolk": {
      "species_name": "Hummingbirdfolk",
      "possible_related_tag_ids": []
    },
    "swanfolk": {
      "species_name": "Swanfolk",
      "possible_related_tag_ids": []
    },
    "duckfolk": {
      "species_name": "Duckfolk",
      "possible_related_tag_ids": []
    },
    "cranefolk": {
      "species_name": "Cranefolk",
      "possible_related_tag_ids": []
    },
    "flamingofolk": {
      "species_name": "Flamingofolk",
      "possible_related_tag_ids": []
    },
    "penguinfolk": {
      "species_name": "Penguinfolk",
      "possible_related_tag_ids": []
    },
    "peacockfolk": {
      "species_name": "Peacockfolk",
      "possible_related_tag_ids": [
        "feather_plumage_aesthetic",
        "consensual_feather_grooming"
      ]
    },
    "vulturefolk": {
      "species_name": "Vulturefolk",
      "possible_related_tag_ids": []
    },
    "ostrichfolk": {
      "species_name": "Ostrichfolk",
      "possible_related_tag_ids": []
    },
    "snakefolk": {
      "species_name": "Snakefolk",
      "possible_related_tag_ids": [
        "scale_pattern_aesthetic",
        "serpentine_body_cuddling"
      ]
    },
    "crocodilefolk": {
      "species_name": "Crocodilefolk",
      "possible_related_tag_ids": []
    },
    "alligatorfolk": {
      "species_name": "Alligatorfolk",
      "possible_related_tag_ids": []
    },
    "turtlefolk": {
      "species_name": "Turtlefolk",
      "possible_related_tag_ids": [
        "shell_carapace_aesthetic"
      ]
    },
    "tortoisefolk": {
      "species_name": "Tortoisefolk",
      "possible_related_tag_ids": []
    },
    "geckofolk": {
      "species_name": "Geckofolk",
      "possible_related_tag_ids": []
    },
    "chameleonfolk": {
      "species_name": "Chameleonfolk",
      "possible_related_tag_ids": []
    },
    "iguanafolk": {
      "species_name": "Iguanafolk",
      "possible_related_tag_ids": []
    },
    "monitorfolk": {
      "species_name": "Monitorfolk",
      "possible_related_tag_ids": []
    },
    "salamanderfolk": {
      "species_name": "Salamanderfolk",
      "possible_related_tag_ids": []
    },
    "newtfolk": {
      "species_name": "Newtfolk",
      "possible_related_tag_ids": []
    },
    "axolotlfolk": {
      "species_name": "Axolotlfolk",
      "possible_related_tag_ids": [
        "fin_gill_aesthetic"
      ]
    },
    "frogfolk": {
      "species_name": "Frogfolk",
      "possible_related_tag_ids": []
    },
    "toadfolk": {
      "species_name": "Toadfolk",
      "possible_related_tag_ids": []
    },
    "fishfolk": {
      "species_name": "Fishfolk",
      "possible_related_tag_ids": [
        "fin_gill_aesthetic",
        "water_compatible_affection",
        "underwater_bioluminescent_dates",
        "rp_undersea_sovereign_fantasy"
      ]
    },
    "sharkfolk": {
      "species_name": "Sharkfolk",
      "possible_related_tag_ids": [
        "scale_pattern_aesthetic",
        "fang_smile_appreciation",
        "fin_gill_aesthetic",
        "water_compatible_affection"
      ]
    },
    "rayfolk": {
      "species_name": "Rayfolk",
      "possible_related_tag_ids": []
    },
    "dolphinfolk": {
      "species_name": "Dolphinfolk",
      "possible_related_tag_ids": []
    },
    "whalefolk": {
      "species_name": "Whalefolk",
      "possible_related_tag_ids": []
    },
    "octopusfolk": {
      "species_name": "Octopusfolk",
      "possible_related_tag_ids": [
        "tentacle_appendage_aesthetic",
        "multiple_arm_embraces",
        "water_compatible_affection",
        "rp_tentacle_contact_fantasy"
      ]
    },
    "squidfolk": {
      "species_name": "Squidfolk",
      "possible_related_tag_ids": [
        "tentacle_appendage_aesthetic"
      ]
    },
    "jellyfishfolk": {
      "species_name": "Jellyfishfolk",
      "possible_related_tag_ids": [
        "bioluminescent_markings",
        "bioluminescent_signaling",
        "underwater_bioluminescent_dates"
      ]
    },
    "eelfolk": {
      "species_name": "Eelfolk",
      "possible_related_tag_ids": []
    },
    "seahorsefolk": {
      "species_name": "Seahorsefolk",
      "possible_related_tag_ids": []
    },
    "anglerfishfolk": {
      "species_name": "Anglerfishfolk",
      "possible_related_tag_ids": [
        "bioluminescent_markings"
      ]
    },
    "crabfolk": {
      "species_name": "Crabfolk",
      "possible_related_tag_ids": [
        "shell_carapace_aesthetic"
      ]
    },
    "lobsterfolk": {
      "species_name": "Lobsterfolk",
      "possible_related_tag_ids": [
        "shell_carapace_aesthetic"
      ]
    },
    "mothfolk": {
      "species_name": "Mothfolk",
      "possible_related_tag_ids": [
        "wing_appreciation",
        "antenna_aesthetic",
        "consensual_wing_care",
        "antenna_safe_touch",
        "wing_span_space_needs",
        "legacy_wing_aware_affection"
      ]
    },
    "butterflyfolk": {
      "species_name": "Butterflyfolk",
      "possible_related_tag_ids": [
        "antenna_aesthetic"
      ]
    },
    "beetlefolk": {
      "species_name": "Beetlefolk",
      "possible_related_tag_ids": [
        "antenna_aesthetic",
        "shell_carapace_aesthetic"
      ]
    },
    "fireflyfolk": {
      "species_name": "Fireflyfolk",
      "possible_related_tag_ids": [
        "bioluminescent_markings",
        "light_based_affection",
        "bioluminescent_signaling"
      ]
    },
    "beefolk": {
      "species_name": "Beefolk",
      "possible_related_tag_ids": [
        "antenna_safe_touch"
      ]
    },
    "waspfolk": {
      "species_name": "Waspfolk",
      "possible_related_tag_ids": []
    },
    "antfolk": {
      "species_name": "Antfolk",
      "possible_related_tag_ids": [
        "antenna_aesthetic",
        "antenna_safe_touch"
      ]
    },
    "mantisfolk": {
      "species_name": "Mantisfolk",
      "possible_related_tag_ids": []
    },
    "dragonflyfolk": {
      "species_name": "Dragonflyfolk",
      "possible_related_tag_ids": [
        "wing_appreciation"
      ]
    },
    "cicadafolk": {
      "species_name": "Cicadafolk",
      "possible_related_tag_ids": []
    },
    "grasshopperfolk": {
      "species_name": "Grasshopperfolk",
      "possible_related_tag_ids": []
    },
    "cricketfolk": {
      "species_name": "Cricketfolk",
      "possible_related_tag_ids": []
    },
    "termitefolk": {
      "species_name": "Termitefolk",
      "possible_related_tag_ids": []
    },
    "stick_insectfolk": {
      "species_name": "Stick insect folk",
      "possible_related_tag_ids": []
    },
    "scorpionfolk": {
      "species_name": "Scorpionfolk",
      "possible_related_tag_ids": []
    },
    "spiderfolk": {
      "species_name": "Spiderfolk",
      "possible_related_tag_ids": []
    },
    "centipedefolk": {
      "species_name": "Centipedefolk",
      "possible_related_tag_ids": []
    },
    "pillbugfolk": {
      "species_name": "Pillbugfolk",
      "possible_related_tag_ids": []
    },
    "kitsune_person": {
      "species_name": "Kitsune person",
      "possible_related_tag_ids": [
        "shape_stable_affection",
        "fox_spirit_courtship"
      ]
    },
    "tanuki_person": {
      "species_name": "Tanuki person",
      "possible_related_tag_ids": []
    },
    "oni_person": {
      "species_name": "Oni person",
      "possible_related_tag_ids": [
        "horn_appreciation",
        "consensual_horn_decoration",
        "oni_folklore_romance",
        "legacy_horn_appreciation"
      ]
    },
    "tengu_person": {
      "species_name": "Tengu person",
      "possible_related_tag_ids": []
    },
    "kappa_person": {
      "species_name": "Kappa person",
      "possible_related_tag_ids": []
    },
    "selkie_person": {
      "species_name": "Selkie person",
      "possible_related_tag_ids": [
        "selkie_shoreline_romance"
      ]
    },
    "kelpie_person": {
      "species_name": "Kelpie person",
      "possible_related_tag_ids": [
        "centaur_body_aware_affection"
      ]
    },
    "banshee_person": {
      "species_name": "Banshee person",
      "possible_related_tag_ids": [
        "spirit_dance"
      ]
    },
    "dullahan_person": {
      "species_name": "Dullahan person",
      "possible_related_tag_ids": []
    },
    "djinn_person": {
      "species_name": "Djinn person",
      "possible_related_tag_ids": []
    },
    "ifrit_person": {
      "species_name": "Ifrit person",
      "possible_related_tag_ids": []
    },
    "valkyrie_person": {
      "species_name": "Valkyrie person",
      "possible_related_tag_ids": []
    },
    "siren_person": {
      "species_name": "Siren person",
      "possible_related_tag_ids": [
        "siren_song_appreciation"
      ]
    },
    "sphinx_person": {
      "species_name": "Sphinx person",
      "possible_related_tag_ids": []
    },
    "alraune_person": {
      "species_name": "Alraune person",
      "possible_related_tag_ids": [
        "botanical_bloom_aesthetic"
      ]
    },
    "leshy_person": {
      "species_name": "Leshy person",
      "possible_related_tag_ids": []
    },
    "rusalka_person": {
      "species_name": "Rusalka person",
      "possible_related_tag_ids": []
    },
    "gargoyle_person": {
      "species_name": "Gargoyle person",
      "possible_related_tag_ids": []
    },
    "cyclops_person": {
      "species_name": "Cyclops person",
      "possible_related_tag_ids": [
        "nonhuman_eye_aesthetic"
      ]
    },
    "phoenix_person": {
      "species_name": "Phoenix person",
      "possible_related_tag_ids": [
        "phoenix_renewal_courtship"
      ]
    },
    "griffinfolk": {
      "species_name": "Griffinfolk",
      "possible_related_tag_ids": [
        "claw_nail_aesthetic",
        "claw_safe_handholding"
      ]
    },
    "unicorn_person": {
      "species_name": "Unicorn person",
      "possible_related_tag_ids": []
    },
    "kirin_person": {
      "species_name": "Kirin person",
      "possible_related_tag_ids": [
        "antler_appreciation"
      ]
    },
    "yeti_person": {
      "species_name": "Yeti person",
      "possible_related_tag_ids": []
    },
    "sasquatch_person": {
      "species_name": "Sasquatch person",
      "possible_related_tag_ids": []
    },
    "imp_person": {
      "species_name": "Imp person",
      "possible_related_tag_ids": []
    },
    "slime_person": {
      "species_name": "Slime person",
      "possible_related_tag_ids": [
        "slime_translucence_aesthetic",
        "nonhuman_surface_sensation",
        "rp_slime_engulfment_fantasy",
        "rp_gelatinous_body_contact",
        "rp_slime_shape_duet"
      ]
    },
    "living_ink_person": {
      "species_name": "Living ink person",
      "possible_related_tag_ids": [
        "slime_translucence_aesthetic"
      ]
    },
    "fungal_person": {
      "species_name": "Fungal person",
      "possible_related_tag_ids": [
        "rp_mycelial_resonance_fantasy"
      ]
    },
    "mycelial_person": {
      "species_name": "Mycelial person",
      "possible_related_tag_ids": []
    },
    "moss_person": {
      "species_name": "Moss person",
      "possible_related_tag_ids": []
    },
    "vine_person": {
      "species_name": "Vine person",
      "possible_related_tag_ids": []
    },
    "flower_person": {
      "species_name": "Flower person",
      "possible_related_tag_ids": [
        "botanical_bloom_aesthetic",
        "scent_and_fragrance_preference",
        "solarpunk_garden_romance"
      ]
    },
    "cactus_person": {
      "species_name": "Cactus person",
      "possible_related_tag_ids": []
    },
    "treefolk": {
      "species_name": "Treefolk",
      "possible_related_tag_ids": [
        "botanical_bloom_aesthetic",
        "solarpunk_garden_romance"
      ]
    },
    "lichen_person": {
      "species_name": "Lichen person",
      "possible_related_tag_ids": []
    },
    "coral_person": {
      "species_name": "Coral person",
      "possible_related_tag_ids": []
    },
    "porcelain_doll_person": {
      "species_name": "Porcelain doll person",
      "possible_related_tag_ids": [
        "porcelain_clockwork_aesthetic",
        "rp_living_statue_awakening",
        "rp_clockwork_ballroom_fantasy"
      ]
    },
    "cloth_doll_person": {
      "species_name": "Cloth doll person",
      "possible_related_tag_ids": []
    },
    "wooden_doll_person": {
      "species_name": "Wooden doll person",
      "possible_related_tag_ids": [
        "porcelain_clockwork_aesthetic"
      ]
    },
    "paper_construct_person": {
      "species_name": "Paper construct person",
      "possible_related_tag_ids": []
    },
    "clockwork_person": {
      "species_name": "Clockwork person",
      "possible_related_tag_ids": [
        "porcelain_clockwork_aesthetic",
        "steampunk_clockwork_aesthetic"
      ]
    },
    "crystal_person": {
      "species_name": "Crystal person",
      "possible_related_tag_ids": [
        "crystal_mineral_aesthetic",
        "nonhuman_surface_sensation"
      ]
    },
    "glass_person": {
      "species_name": "Glass person",
      "possible_related_tag_ids": [
        "slime_translucence_aesthetic"
      ]
    },
    "living_armor_person": {
      "species_name": "Living armor person",
      "possible_related_tag_ids": []
    },
    "mimic_person": {
      "species_name": "Mimic person",
      "possible_related_tag_ids": []
    },
    "puppet_person": {
      "species_name": "Puppet person",
      "possible_related_tag_ids": []
    },
    "flame_person": {
      "species_name": "Flame person",
      "possible_related_tag_ids": [
        "flame_light_aesthetic",
        "elemental_temperature_romance",
        "elemental_aura_admiration"
      ]
    },
    "water_elemental_person": {
      "species_name": "Water elemental person",
      "possible_related_tag_ids": [
        "elemental_temperature_romance"
      ]
    },
    "air_elemental_person": {
      "species_name": "Air elemental person",
      "possible_related_tag_ids": []
    },
    "ice_elemental_person": {
      "species_name": "Ice elemental person",
      "possible_related_tag_ids": [
        "elemental_temperature_romance"
      ]
    },
    "shadow_person": {
      "species_name": "Shadow person",
      "possible_related_tag_ids": []
    },
    "light_person": {
      "species_name": "Light person",
      "possible_related_tag_ids": [
        "flame_light_aesthetic",
        "light_based_affection",
        "celestial_sigils_romance",
        "elemental_aura_admiration"
      ]
    },
    "storm_person": {
      "species_name": "Storm person",
      "possible_related_tag_ids": [
        "elemental_aura_admiration"
      ]
    },
    "sand_person": {
      "species_name": "Sand person",
      "possible_related_tag_ids": []
    },
    "smoke_person": {
      "species_name": "Smoke person",
      "possible_related_tag_ids": []
    },
    "ash_person": {
      "species_name": "Ash person",
      "possible_related_tag_ids": []
    },
    "wax_person": {
      "species_name": "Wax person",
      "possible_related_tag_ids": []
    },
    "stone_elemental_person": {
      "species_name": "Stone elemental person",
      "possible_related_tag_ids": [
        "crystal_mineral_aesthetic",
        "nonhuman_surface_sensation",
        "legacy_scale_and_nonhuman_surface_appreciation"
      ]
    },
    "salt_person": {
      "species_name": "Salt person",
      "possible_related_tag_ids": []
    },
    "energy_person": {
      "species_name": "Energy person",
      "possible_related_tag_ids": [
        "bioluminescent_markings",
        "flame_light_aesthetic",
        "light_based_affection",
        "bioluminescent_signaling",
        "celestial_constellation_letters",
        "rp_living_constellation_romance"
      ]
    },
    "plasma_person": {
      "species_name": "Plasma person",
      "possible_related_tag_ids": [
        "bioluminescent_markings",
        "flame_light_aesthetic",
        "light_based_affection",
        "bioluminescent_signaling"
      ]
    },
    "gas_person": {
      "species_name": "Gas person",
      "possible_related_tag_ids": []
    },
    "swarm_person": {
      "species_name": "Swarm person",
      "possible_related_tag_ids": [
        "tentacle_appendage_aesthetic",
        "rp_multiple_minds_consent_ritual",
        "rp_hive_mind_courtship_rules"
      ]
    },
    "nanite_person": {
      "species_name": "Nanite person",
      "possible_related_tag_ids": []
    },
    "distributed_ai_person": {
      "species_name": "Distributed AI person",
      "possible_related_tag_ids": [
        "avatar_style_roleplay",
        "synthetic_voice_aesthetic",
        "hologram_date_projection"
      ]
    },
    "biomechanical_person": {
      "species_name": "Biomechanical person",
      "possible_related_tag_ids": [
        "synthetic_design_aesthetic",
        "augmentation_aesthetic",
        "prosthetic_style_romance",
        "biomechanical_pattern_aesthetic"
      ]
    },
    "crystalline_alien": {
      "species_name": "Crystalline alien",
      "possible_related_tag_ids": [
        "crystal_mineral_aesthetic"
      ]
    },
    "arthropod_alien": {
      "species_name": "Arthropod alien",
      "possible_related_tag_ids": [
        "alien_sensory_compatibility"
      ]
    },
    "cephalopod_alien": {
      "species_name": "Cephalopod alien",
      "possible_related_tag_ids": [
        "tentacle_appendage_aesthetic",
        "multiple_arm_embraces",
        "rp_tentacle_contact_fantasy",
        "rp_multi_limb_alien_embrace"
      ]
    },
    "avian_alien": {
      "species_name": "Avian alien",
      "possible_related_tag_ids": []
    },
    "reptilian_alien": {
      "species_name": "Reptilian alien",
      "possible_related_tag_ids": []
    },
    "insectoid_alien": {
      "species_name": "Insectoid alien",
      "possible_related_tag_ids": []
    },
    "shapeshifting_alien": {
      "species_name": "Shapeshifting alien",
      "possible_related_tag_ids": [
        "shape_stable_affection",
        "shifter_form_admiration",
        "shifter_identity_trust"
      ]
    },
    "photosynthetic_alien": {
      "species_name": "Photosynthetic alien",
      "possible_related_tag_ids": [
        "alien_sensory_compatibility"
      ]
    },
    "space_adapted_human": {
      "species_name": "Space-adapted human",
      "possible_related_tag_ids": [
        "augmentation_aesthetic",
        "interstellar_language_flirting"
      ]
    },
    "vatgrown_person": {
      "species_name": "Vat-grown person",
      "possible_related_tag_ids": []
    },
    "clone_person": {
      "species_name": "Clone person",
      "possible_related_tag_ids": []
    },
    "virtual_avatar_person": {
      "species_name": "Virtual avatar person",
      "possible_related_tag_ids": [
        "private_vr_date",
        "avatar_style_roleplay",
        "hologram_date_projection"
      ]
    },
    "modular_robot_person": {
      "species_name": "Modular robot person",
      "possible_related_tag_ids": [
        "synthetic_design_aesthetic",
        "modular_body_styling"
      ]
    },
    "soft_robot_person": {
      "species_name": "Soft robot person",
      "possible_related_tag_ids": [
        "synthetic_design_aesthetic",
        "synthetic_touch_boundaries",
        "modular_body_styling",
        "robotic_gesture_romance"
      ]
    },
    "symbiotic_person": {
      "species_name": "Symbiotic person",
      "possible_related_tag_ids": []
    },
    "half_elf": {
      "species_name": "Half-elf",
      "possible_related_tag_ids": [
        "pointed_ear_appreciation"
      ]
    },
    "half_dwarf": {
      "species_name": "Half-dwarf",
      "possible_related_tag_ids": []
    },
    "half_giant": {
      "species_name": "Half-giant",
      "possible_related_tag_ids": [
        "size_difference_affection"
      ]
    },
    "fae_descended_person": {
      "species_name": "Fae-descended person",
      "possible_related_tag_ids": [
        "fae_name_play",
        "fae_bargain_roleplay",
        "celestial_sigils_romance"
      ]
    },
    "human_alien_hybrid": {
      "species_name": "Human–alien hybrid",
      "possible_related_tag_ids": [
        "interstellar_language_flirting"
      ]
    },
    "mixed_species_person": {
      "species_name": "Mixed-species person",
      "possible_related_tag_ids": []
    }
  },
  "open_vocabulary_extension": {
    "allowed": "opt_in",
    "proposal_schema": [
      "id",
      "label",
      "description",
      "kind",
      "requires_world_capabilities",
      "suggested_universe_tags",
      "illustrative_species_ids",
      "evidence_refs"
    ],
    "id_prefix": "custom_",
    "rules": [
      "Never convert an LLM suggestion into a preference of any character without explicit review and consent.",
      "New term can be proposed even if species or universe is not in this catalog.",
      "Preserve stable IDs; do not change existing accepted preferences if tags are omitted.",
      "Character acceptance does not globally enable new preferences."
    ]
  },
  "v3_guardrails": {
    "status": "Reference taxonomy only. These terms are not explicit prompts and do not grant roleplay consent.",
    "visibility": "Keep all terms private by default; do not surface as public profile defaults or auto-match criteria.",
    "personalization": "Species, morphology and universe tags indicate fictional possibility, not an individual's preferences or behavior.",
    "consent": "Consent is person-specific, ongoing, revocable. Actual refusal overrides every narrative trope, including resistance fiction, magical bonds, and sci-fi protocols.",
    "sensitive_reproduction": "Reproductive-themed terms are non-graphic fiction for adults. Never presume pregnancy, fertility, reproductive consent, or loss of autonomy.",
    "independent_agency": "Every independently sentient adult—including duplicates, symbiotes and collective members—must make their own decisions.",
    "generation": "Do not pass the full catalog in routine prompts. Include only explicit selected terms, applicable anatomy, accepted lore and boundaries.",
    "acceptance": "New LLM-created terms stay proposals. Omissions, species, settings and matches never alter accepted private preferences.",
    "compatibility": "Keep all v1/v2 stable IDs; no migration of current character preferences or accepted world capabilities is implied.",
    "safety": "No real-world coercion, account access, dangerous restraint, nonconsensual intimacy, minors or animals."
  }
} as const;
