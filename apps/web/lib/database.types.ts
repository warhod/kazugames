export type GameStatus = 'owned' | 'wishlist' | 'playing' | 'completed' | 'abandoned';
export type LoanStatus = 'requested' | 'approved' | 'declined' | 'returned';

export interface DbGame {
  id: string;
  title: string;
  deku_url: string;
  image_url: string | null;
  current_price: number | null;
  msrp: number | null;
  description: string | null;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface DbUserGame {
  id: string;
  user_id: string;
  game_id: string;
  status: GameStatus;
  lendable: boolean;
  created_at: string;
  game?: DbGame;
}

export interface DbGroup {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface DbGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbGameLoan {
  id: string;
  game_id: string;
  owner_id: string;
  borrower_id: string;
  group_id: string;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
  game?: DbGame;
}

/** Fields from `profiles` exposed to groupmates via the groups API. */
export interface DbPublicProfile {
  display_name: string | null;
  /** Local-part of signup email when display_name is unset (group lists). */
  account_hint: string | null;
  friend_code: string | null;
  nintendo_profile_url: string | null;
}

export interface DbGroupMemberView {
  user_id: string;
  joined_at: string;
  profile: DbPublicProfile;
}

export interface DbProfileRow extends DbPublicProfile {
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbLendableGameRow {
  id: string;
  user_id: string;
  game_id: string;
  status: GameStatus;
  lendable: boolean;
  game: DbGame;
  owner_profile: DbPublicProfile;
}
