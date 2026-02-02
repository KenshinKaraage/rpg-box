'use client';

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export interface AccountMenuProps {
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onProfile?: () => void;
}

export function AccountMenu({
  isLoggedIn = false,
  onLogin,
  onLogout,
  onProfile,
}: AccountMenuProps) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>アカウント</DropdownMenuLabel>
      {!isLoggedIn ? (
        <DropdownMenuItem onSelect={onLogin}>ログイン</DropdownMenuItem>
      ) : (
        <>
          <DropdownMenuItem onSelect={onProfile}>プロフィール</DropdownMenuItem>
          <DropdownMenuItem onSelect={onLogout}>ログアウト</DropdownMenuItem>
        </>
      )}
    </DropdownMenuGroup>
  );
}
