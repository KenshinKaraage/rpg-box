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
];
