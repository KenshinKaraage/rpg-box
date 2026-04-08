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
      { path: '/assets/images/map_chip/at_cave01.png', name: 'at_cave01' },
      { path: '/assets/images/map_chip/at_cave02.png', name: 'at_cave02' },
      { path: '/assets/images/map_chip/at_cave03.png', name: 'at_cave03' },
      { path: '/assets/images/map_chip/at_cave04.png', name: 'at_cave04' },
      { path: '/assets/images/map_chip/at_dang01.png', name: 'at_dang01' },
      { path: '/assets/images/map_chip/at_dang02.png', name: 'at_dang02' },
      { path: '/assets/images/map_chip/at_dang03.png', name: 'at_dang03' },
      { path: '/assets/images/map_chip/m_castle.png', name: 'm_castle' },
      { path: '/assets/images/map_chip/m_cave.png', name: 'm_cave' },
      { path: '/assets/images/map_chip/m_mori.png', name: 'm_mori' },
      { path: '/assets/images/map_chip/m_mura.png', name: 'm_mura' },
      { path: '/assets/images/map_chip/m_snowtown.png', name: 'm_snowtown' },
      { path: '/assets/images/map_chip/m_town.png', name: 'm_town' },
      { path: '/assets/images/map_chip/t_castle01.png', name: 't_castle01' },
      { path: '/assets/images/map_chip/t_castle02.png', name: 't_castle02' },
      { path: '/assets/images/map_chip/t_castle03.png', name: 't_castle03' },
      { path: '/assets/images/map_chip/t_castle04.png', name: 't_castle04' },
      { path: '/assets/images/map_chip/t_cave01.png', name: 't_cave01' },
      { path: '/assets/images/map_chip/t_cave02.png', name: 't_cave02' },
      { path: '/assets/images/map_chip/t_cave03.png', name: 't_cave03' },
      { path: '/assets/images/map_chip/t_cave04.png', name: 't_cave04' },
      { path: '/assets/images/map_chip/t_cave05.png', name: 't_cave05' },
      { path: '/assets/images/map_chip/t_cave06.png', name: 't_cave06' },
      { path: '/assets/images/map_chip/t_dang01.png', name: 't_dang01' },
      { path: '/assets/images/map_chip/t_mori01.png', name: 't_mori01' },
      { path: '/assets/images/map_chip/t_mura01.png', name: 't_mura01' },
      { path: '/assets/images/map_chip/t_room01.png', name: 't_room01' },
      { path: '/assets/images/map_chip/t_room02.png', name: 't_room02' },
      { path: '/assets/images/map_chip/t_room03.png', name: 't_room03' },
      { path: '/assets/images/map_chip/t_snow01.png', name: 't_snow01' },
      { path: '/assets/images/map_chip/t_snow02.png', name: 't_snow02' },
      { path: '/assets/images/map_chip/t_snow03.png', name: 't_snow03' },
      { path: '/assets/images/map_chip/t_snow04.png', name: 't_snow04' },
      { path: '/assets/images/map_chip/t_town01.png', name: 't_town01' },
      { path: '/assets/images/map_chip/t_town02.png', name: 't_town02' },
      { path: '/assets/images/map_chip/t_town03.png', name: 't_town03' },
      { path: '/assets/images/map_chip/t_town04.png', name: 't_town04' },
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
];
