-- Sprint 27: Seed coral species data
-- Popular beginner to expert corals for reef tanks

INSERT INTO public.species (
  common_name, scientific_name, type, care_level, temperament,
  min_tank_size_gallons, max_size_inches, temp_min_f, temp_max_f,
  ph_min, ph_max, diet, compatibility_notes, description
) VALUES
-- Soft Corals (Beginner-friendly)
(
  'Green Star Polyps', 'Pachyclavularia violacea', 'coral', 'beginner', 'peaceful',
  10, 12, 75, 82, 8.1, 8.4,
  'Photosynthetic, occasional spot feeding',
  'Fast grower, can encrust nearby surfaces. Keep on isolated rock to contain spread.',
  'Hardy soft coral perfect for beginners. Forms a beautiful green mat of polyps that wave in the current. Tolerates a wide range of conditions.'
),
(
  'Pulsing Xenia', 'Xenia elongata', 'coral', 'beginner', 'peaceful',
  10, 8, 76, 82, 8.1, 8.4,
  'Photosynthetic',
  'Very fast grower, can become invasive. Keep on isolated rock.',
  'Mesmerizing pulsing motion makes this a tank favorite. The polyps rhythmically open and close. Easy to frag and share.'
),
(
  'Toadstool Leather Coral', 'Sarcophyton spp.', 'coral', 'beginner', 'peaceful',
  30, 18, 75, 82, 8.1, 8.4,
  'Photosynthetic',
  'Releases toxins when stressed. Run carbon and allow space from other corals.',
  'Classic leather coral with a mushroom-like appearance. Polyps extend from the cap creating a fuzzy look. Very hardy.'
),
(
  'Kenya Tree Coral', 'Capnella spp.', 'coral', 'beginner', 'peaceful',
  20, 12, 75, 82, 8.1, 8.4,
  'Photosynthetic',
  'Drops branches that can root elsewhere. Fast grower.',
  'Tree-like soft coral that sways beautifully in current. Self-propagates by dropping branches. Great beginner coral.'
),
(
  'Mushroom Coral', 'Rhodactis spp.', 'coral', 'beginner', 'peaceful',
  10, 6, 75, 82, 8.0, 8.4,
  'Photosynthetic, occasional meaty foods',
  'Can sting nearby corals. Give adequate spacing.',
  'Colorful disc-shaped coral that comes in many varieties. Very tolerant of different lighting and flow conditions.'
),
-- LPS Corals (Intermediate)
(
  'Hammer Coral', 'Euphyllia ancora', 'coral', 'intermediate', 'semi_aggressive',
  30, 12, 76, 82, 8.1, 8.4,
  'Photosynthetic, weekly target feeding recommended',
  'Has sweeper tentacles that extend at night. Keep 6+ inches from other corals.',
  'Popular LPS with hammer-shaped tentacle tips. Sways dramatically in flow. Available in many color morphs including gold and branching varieties.'
),
(
  'Torch Coral', 'Euphyllia glabrescens', 'coral', 'intermediate', 'semi_aggressive',
  30, 12, 76, 82, 8.1, 8.4,
  'Photosynthetic, weekly target feeding',
  'Long sweeper tentacles can sting corals several inches away. Keep isolated.',
  'Stunning coral with flowing tentacles tipped in contrasting colors. Popular varieties include holy grail and dragon soul.'
),
(
  'Frogspawn Coral', 'Euphyllia divisa', 'coral', 'intermediate', 'semi_aggressive',
  30, 12, 76, 82, 8.1, 8.4,
  'Photosynthetic, weekly target feeding',
  'Aggressive sweeper tentacles. Space away from other corals.',
  'Named for tentacle tips that resemble frog eggs. Related to hammer and torch corals. Available in branching and wall varieties.'
),
(
  'Duncan Coral', 'Duncanopsammia axifuga', 'coral', 'intermediate', 'peaceful',
  20, 8, 76, 82, 8.1, 8.4,
  'Photosynthetic, benefits from target feeding',
  'Peaceful coral, safe near most tank mates.',
  'Fast-growing LPS with daisy-like polyps. Responds well to feeding with visible polyp extension. Great for beginners to LPS.'
),
(
  'Candy Cane Coral', 'Caulastrea furcata', 'coral', 'intermediate', 'peaceful',
  20, 8, 76, 82, 8.1, 8.4,
  'Photosynthetic, occasional feeding',
  'Peaceful, safe near other corals.',
  'Trumpet-shaped polyps in various colors. Hardy LPS good for beginners. Grows by adding new heads.'
),
-- SPS Corals (Expert)
(
  'Acropora', 'Acropora spp.', 'coral', 'expert', 'peaceful',
  50, 24, 76, 80, 8.2, 8.4,
  'Photosynthetic, requires pristine water',
  'Very sensitive to parameter swings. Requires stable alkalinity, calcium, and magnesium.',
  'The king of SPS corals. Branching growth forms with tiny polyps. Requires high light, strong flow, and excellent water quality. Many stunning color varieties.'
),
(
  'Montipora', 'Montipora spp.', 'coral', 'expert', 'peaceful',
  30, 18, 76, 80, 8.2, 8.4,
  'Photosynthetic',
  'More forgiving than Acropora but still requires stable parameters.',
  'Comes in plating, encrusting, and branching varieties. Rainbow monti and forest fire are popular morphs. Good stepping stone to SPS keeping.'
),
(
  'Stylophora', 'Stylophora pistillata', 'coral', 'expert', 'peaceful',
  30, 12, 76, 80, 8.2, 8.4,
  'Photosynthetic',
  'Sensitive to parameter swings. Needs stable environment.',
  'Dense branching coral often called Cat''s Paw. Pink and purple varieties are common. Hardy for an SPS coral.'
),
(
  'Birds Nest Coral', 'Seriatopora hystrix', 'coral', 'expert', 'peaceful',
  30, 12, 76, 80, 8.2, 8.4,
  'Photosynthetic',
  'Thin branches break easily. Position carefully.',
  'Delicate thin-branched coral forming intricate structures. Available in pink, green, and yellow. Grows quickly once established.'
),
(
  'Chalice Coral', 'Echinophyllia spp.', 'coral', 'intermediate', 'semi_aggressive',
  30, 18, 76, 82, 8.1, 8.4,
  'Photosynthetic, benefits from target feeding',
  'Has sweeper tentacles at night. Space from other corals.',
  'Plating coral with amazing color combinations. Popular varieties include Miami Hurricane and Watermelon. Grows encrusting patterns.'
)
ON CONFLICT (common_name) DO NOTHING;
