export interface DefaultAssetEntry {
  path: string;
  name: string;
}

export interface DefaultAssetGroup {
  folderName: string;
  assets: DefaultAssetEntry[];
}

export const DEFAULT_ASSET_GROUPS: DefaultAssetGroup[] = [
  {
    folderName: 'マップチップ',
    assets: [
      // オートタイル（[A]接頭辞、autotile: true 用、64x160=2列x5バリアント）
      { path: '/assets/images/map_chip/[A]Grass1_pipo.png', name: '[A]Grass1_pipo' },
      { path: '/assets/images/map_chip/[A]Grass2_pipo.png', name: '[A]Grass2_pipo' },
      { path: '/assets/images/map_chip/[A]Grass3_pipo.png', name: '[A]Grass3_pipo' },
      { path: '/assets/images/map_chip/[A]Grass4_pipo.png', name: '[A]Grass4_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Grass2_pipo.png', name: '[A]Grass1-Grass2_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Grass3_pipo.png', name: '[A]Grass1-Grass3_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Grass4_pipo.png', name: '[A]Grass1-Grass4_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Dirt1_pipo.png', name: '[A]Grass1-Dirt1_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Dirt2_pipo.png', name: '[A]Grass1-Dirt2_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Dirt3_pipo.png', name: '[A]Grass1-Dirt3_pipo' },
      { path: '/assets/images/map_chip/[A]Grass1-Dirt4_pipo.png', name: '[A]Grass1-Dirt4_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt1_pipo.png', name: '[A]Dirt1_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt2_pipo.png', name: '[A]Dirt2_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt3_pipo.png', name: '[A]Dirt3_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt4_pipo.png', name: '[A]Dirt4_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt1-Dirt2_pipo.png', name: '[A]Dirt1-Dirt2_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt1-Dirt3_pipo.png', name: '[A]Dirt1-Dirt3_pipo' },
      { path: '/assets/images/map_chip/[A]Dirt1-Dirt4_pipo.png', name: '[A]Dirt1-Dirt4_pipo' },
      { path: '/assets/images/map_chip/[A]Flower_pipo.png', name: '[A]Flower_pipo' },
      { path: '/assets/images/map_chip/[A]LongGrass_pipo.png', name: '[A]LongGrass_pipo' },
      { path: '/assets/images/map_chip/[A]Wall-Up1_pipo.png', name: '[A]Wall-Up1_pipo' },
      { path: '/assets/images/map_chip/[A]Wall-Up2_pipo.png', name: '[A]Wall-Up2_pipo' },
      { path: '/assets/images/map_chip/[A]Water1_pipo.png', name: '[A]Water1_pipo' },
      { path: '/assets/images/map_chip/[A]Water2_pipo.png', name: '[A]Water2_pipo' },
      { path: '/assets/images/map_chip/[A]Water3_pipo.png', name: '[A]Water3_pipo' },
      { path: '/assets/images/map_chip/[A]Water3_Cave1_pipo.png', name: '[A]Water3_Cave1_pipo' },
      { path: '/assets/images/map_chip/[A]Water4_pipo.png', name: '[A]Water4_pipo' },
      { path: '/assets/images/map_chip/[A]Water5_pipo.png', name: '[A]Water5_pipo' },
      { path: '/assets/images/map_chip/[A]Water6_pipo.png', name: '[A]Water6_pipo' },
      { path: '/assets/images/map_chip/[A]Water7_pipo.png', name: '[A]Water7_pipo' },
      { path: '/assets/images/map_chip/[A]WaterFall1_pipo.png', name: '[A]WaterFall1_pipo' },
      { path: '/assets/images/map_chip/[A]WaterFall2_pipo.png', name: '[A]WaterFall2_pipo' },
      { path: '/assets/images/map_chip/[A]WaterFall3_pipo.png', name: '[A]WaterFall3_pipo' },
      // 通常チップ（[Base]接頭辞、autotile: false 用）
      { path: '/assets/images/map_chip/[Base]BaseChip_pipo.png', name: '[Base]BaseChip_pipo' },
    ],
  },
  {
    folderName: 'キャラクター',
    assets: [
      { path: '/assets/images/character/character_full_alice.png', name: 'character_alice' },
      { path: '/assets/images/character/character_full_ian.png', name: 'character_ian' },
      { path: '/assets/images/character/character_full_lex.png', name: 'character_lex' },
      { path: '/assets/images/character/character_full_margrite.png', name: 'character_margrite' },
    ],
  },
  {
    folderName: 'キャラクター顔',
    assets: [
      { path: '/assets/images/character_face/character_face_alice.png', name: 'face_alice' },
      { path: '/assets/images/character_face/character_face_ian.png', name: 'face_ian' },
      { path: '/assets/images/character_face/character_face_lex.png', name: 'face_lex' },
      { path: '/assets/images/character_face/character_face_margrite.png', name: 'face_margrite' },
    ],
  },
  {
    folderName: '歩行キャラ',
    assets: [
      { path: '/assets/images/character_walk/character_walk_alice.png', name: 'walk_alice' },
      { path: '/assets/images/character_walk/character_walk_ian.png', name: 'walk_ian' },
      { path: '/assets/images/character_walk/character_walk_lex.png', name: 'walk_lex' },
      {
        path: '/assets/images/character_walk/character_walk_marguerite.png',
        name: 'walk_marguerite',
      },
    ],
  },
  {
    folderName: 'エフェクト',
    assets: [
      { path: '/assets/images/effect/effect_fire.png', name: 'effect_fire' },
      { path: '/assets/images/effect/effect_ice.png', name: 'effect_ice' },
      { path: '/assets/images/effect/effect_thunder.png', name: 'effect_thunder' },
      { path: '/assets/images/effect/effect_poison.png', name: 'effect_poison' },
      { path: '/assets/images/effect/effect_hit.png', name: 'effect_hit' },
      { path: '/assets/images/effect/effect_firebomb.png', name: 'effect_firebomb' },
      { path: '/assets/images/effect/effect_up.png', name: 'effect_up' },
      { path: '/assets/images/effect/effect_down.png', name: 'effect_down' },
      { path: '/assets/images/effect/effect_heal.png', name: 'effect_heal' },
      { path: '/assets/images/effect/effect_magiccircle.png', name: 'effect_magiccircle' },
    ],
  },
  {
    folderName: 'BGM',
    assets: [
      { path: '/assets/sounds/bgm/Morning.mp3', name: 'bgm_morning' },
      { path: '/assets/sounds/bgm/Encounter.mp3', name: 'bgm_encounter' },
      { path: '/assets/sounds/bgm/Do_not_go_against_me.mp3', name: 'bgm_battle' },
      { path: '/assets/sounds/bgm/ほんわかぷっぷー.mp3', name: 'bgm_honwaka' },
      { path: '/assets/sounds/bgm/向日葵.mp3', name: 'bgm_himawari' },
      { path: '/assets/sounds/bgm/森のいざない.mp3', name: 'bgm_forest' },
      { path: '/assets/sounds/bgm/戦いの旅路を征く.mp3', name: 'bgm_journey' },
      { path: '/assets/sounds/bgm/抜け道.mp3', name: 'bgm_shortcut' },
      { path: '/assets/sounds/bgm/リシュリュー～孤独な正義～.mp3', name: 'bgm_richelieu' },
    ],
  },
  {
    folderName: 'SE（システム）',
    assets: [
      { path: '/assets/sounds/se_system/決定ボタンを押す24.mp3', name: 'se_confirm' },
      { path: '/assets/sounds/se_system/決定ボタンを押す34.mp3', name: 'se_confirm2' },
      { path: '/assets/sounds/se_system/キャンセル5.mp3', name: 'se_cancel' },
      { path: '/assets/sounds/se_system/カーソル移動4(1).mp3', name: 'se_cursor' },
      { path: '/assets/sounds/se_system/ビープ音4.mp3', name: 'se_beep' },
    ],
  },
  {
    folderName: 'SE（エフェクト）',
    assets: [{ path: '/assets/sounds/se_effect/ビシッとツッコミ2.mp3', name: 'se_hit' }],
  },
  {
    folderName: '敵画像',
    assets: [
      { path: '/assets/images/enemy/slime.bmp', name: 'enemy_slime' },
      { path: '/assets/images/enemy/goblin.bmp', name: 'enemy_goblin' },
      { path: '/assets/images/enemy/ox.bmp', name: 'enemy_ox' },
      { path: '/assets/images/enemy/golem.bmp', name: 'enemy_golem' },
      { path: '/assets/images/enemy/wyvern.bmp', name: 'enemy_wyvern' },
      { path: '/assets/images/enemy/fireDragon.bmp', name: 'enemy_fire_dragon' },
      { path: '/assets/images/enemy/greenDragon.bmp', name: 'enemy_green_dragon' },
      { path: '/assets/images/enemy/iceDragon.bmp', name: 'enemy_ice_dragon' },
      { path: '/assets/images/enemy/whiteDragon.bmp', name: 'enemy_white_dragon' },
    ],
  },
  {
    folderName: 'フォント',
    assets: [{ path: '/assets/fonts/PixelMplus10-Regular.ttf', name: 'font_pixel' }],
  },
];
