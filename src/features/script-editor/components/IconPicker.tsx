'use client';

import { useState } from 'react';
import {
  Sword,
  Swords,
  Shield,
  ShieldAlert,
  Crosshair,
  Target,
  Zap,
  Flame,
  Snowflake,
  Wind,
  Heart,
  HeartPulse,
  Star,
  Sparkles,
  Crown,
  Gem,
  Diamond,
  Package,
  ShoppingBag,
  Coins,
  Wallet,
  Scroll,
  BookOpen,
  FileText,
  Map,
  Compass,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  Users,
  User,
  UserPlus,
  Skull,
  Ghost,
  Bug,
  Move,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Footprints,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Music,
  Volume2,
  Play,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Droplets,
  Settings,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Camera,
  Image,
  Palette,
  Wand2,
  Sparkle,
  Timer,
  Clock,
  Hourglass,
  Home,
  Building,
  TreePine,
  Mountain,
  Anchor,
  Flag,
  Award,
  Trophy,
  CircleDot,
  Dice6,
  Feather,
  Leaf,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ICON_PRESETS: { name: string; icon: LucideIcon; category: string }[] = [
  // 戦闘
  { name: 'sword', icon: Sword, category: '戦闘' },
  { name: 'swords', icon: Swords, category: '戦闘' },
  { name: 'shield', icon: Shield, category: '戦闘' },
  { name: 'shield-alert', icon: ShieldAlert, category: '戦闘' },
  { name: 'crosshair', icon: Crosshair, category: '戦闘' },
  { name: 'target', icon: Target, category: '戦闘' },
  { name: 'zap', icon: Zap, category: '戦闘' },
  { name: 'flame', icon: Flame, category: '戦闘' },
  { name: 'snowflake', icon: Snowflake, category: '戦闘' },
  { name: 'wind', icon: Wind, category: '戦闘' },
  { name: 'skull', icon: Skull, category: '戦闘' },
  { name: 'ghost', icon: Ghost, category: '戦闘' },
  { name: 'bug', icon: Bug, category: '戦闘' },
  // ステータス
  { name: 'heart', icon: Heart, category: 'ステータス' },
  { name: 'heart-pulse', icon: HeartPulse, category: 'ステータス' },
  { name: 'star', icon: Star, category: 'ステータス' },
  { name: 'sparkles', icon: Sparkles, category: 'ステータス' },
  { name: 'crown', icon: Crown, category: 'ステータス' },
  { name: 'award', icon: Award, category: 'ステータス' },
  { name: 'trophy', icon: Trophy, category: 'ステータス' },
  // アイテム
  { name: 'gem', icon: Gem, category: 'アイテム' },
  { name: 'diamond', icon: Diamond, category: 'アイテム' },
  { name: 'package', icon: Package, category: 'アイテム' },
  { name: 'shopping-bag', icon: ShoppingBag, category: 'アイテム' },
  { name: 'coins', icon: Coins, category: 'アイテム' },
  { name: 'wallet', icon: Wallet, category: 'アイテム' },
  { name: 'key', icon: Key, category: 'アイテム' },
  // 知識
  { name: 'scroll', icon: Scroll, category: '知識' },
  { name: 'book-open', icon: BookOpen, category: '知識' },
  { name: 'file-text', icon: FileText, category: '知識' },
  { name: 'map', icon: Map, category: '知識' },
  { name: 'compass', icon: Compass, category: '知識' },
  // 会話
  { name: 'message-square', icon: MessageSquare, category: '会話' },
  { name: 'message-circle', icon: MessageCircle, category: '会話' },
  { name: 'help-circle', icon: HelpCircle, category: '会話' },
  { name: 'alert-triangle', icon: AlertTriangle, category: '会話' },
  { name: 'info', icon: Info, category: '会話' },
  // キャラ
  { name: 'users', icon: Users, category: 'キャラ' },
  { name: 'user', icon: User, category: 'キャラ' },
  { name: 'user-plus', icon: UserPlus, category: 'キャラ' },
  // 移動
  { name: 'move', icon: Move, category: '移動' },
  { name: 'arrow-right', icon: ArrowRight, category: '移動' },
  { name: 'arrow-up', icon: ArrowUp, category: '移動' },
  { name: 'rotate-cw', icon: RotateCw, category: '移動' },
  { name: 'footprints', icon: Footprints, category: '移動' },
  // 表示
  { name: 'eye', icon: Eye, category: '表示' },
  { name: 'eye-off', icon: EyeOff, category: '表示' },
  { name: 'lock', icon: Lock, category: '表示' },
  { name: 'unlock', icon: Unlock, category: '表示' },
  // 音声
  { name: 'music', icon: Music, category: '音声' },
  { name: 'volume-2', icon: Volume2, category: '音声' },
  { name: 'play', icon: Play, category: '音声' },
  // 環境
  { name: 'sun', icon: Sun, category: '環境' },
  { name: 'moon', icon: Moon, category: '環境' },
  { name: 'cloud', icon: Cloud, category: '環境' },
  { name: 'cloud-rain', icon: CloudRain, category: '環境' },
  { name: 'droplets', icon: Droplets, category: '環境' },
  // システム
  { name: 'settings', icon: Settings, category: 'システム' },
  { name: 'save', icon: Save, category: 'システム' },
  { name: 'refresh-cw', icon: RefreshCw, category: 'システム' },
  { name: 'trash-2', icon: Trash2, category: 'システム' },
  { name: 'plus', icon: Plus, category: 'システム' },
  { name: 'timer', icon: Timer, category: 'システム' },
  { name: 'clock', icon: Clock, category: 'システム' },
  { name: 'hourglass', icon: Hourglass, category: 'システム' },
  { name: 'circle-dot', icon: CircleDot, category: 'システム' },
  { name: 'dice-6', icon: Dice6, category: 'システム' },
  // 演出
  { name: 'camera', icon: Camera, category: '演出' },
  { name: 'image', icon: Image, category: '演出' },
  { name: 'palette', icon: Palette, category: '演出' },
  { name: 'wand-2', icon: Wand2, category: '演出' },
  { name: 'sparkle', icon: Sparkle, category: '演出' },
  // 場所
  { name: 'home', icon: Home, category: '場所' },
  { name: 'building', icon: Building, category: '場所' },
  { name: 'tree-pine', icon: TreePine, category: '場所' },
  { name: 'mountain', icon: Mountain, category: '場所' },
  { name: 'anchor', icon: Anchor, category: '場所' },
  { name: 'flag', icon: Flag, category: '場所' },
  // 自然
  { name: 'feather', icon: Feather, category: '自然' },
  { name: 'leaf', icon: Leaf, category: '自然' },
];

/** アイコン名 → コンポーネント */
const ICON_MAP: Record<string, LucideIcon> = {};
for (const p of ICON_PRESETS) ICON_MAP[p.name] = p.icon;

export function getScriptIcon(name?: string): LucideIcon {
  if (name && ICON_MAP[name]) return ICON_MAP[name];
  return FileText;
}

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const CurrentIcon = getScriptIcon(value);

  const categories = Array.from(new Set(ICON_PRESETS.map((p) => p.category)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="text-xs">{value || 'なし'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="max-h-[400px] space-y-2 overflow-auto">
          {/* なし */}
          <button
            className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">なし</span>
          </button>
          {categories.map((cat) => (
            <div key={cat}>
              <div className="mb-1 text-[10px] font-semibold text-muted-foreground">{cat}</div>
              <div className="grid grid-cols-8 gap-1">
                {ICON_PRESETS.filter((p) => p.category === cat).map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.name}
                      className={`flex h-8 w-8 items-center justify-center rounded hover:bg-accent ${value === p.name ? 'bg-accent ring-1 ring-primary' : ''}`}
                      title={p.name}
                      onClick={() => {
                        onChange(p.name);
                        setOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
