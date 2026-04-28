"use client";

import { useState } from "react";
import CollectionGrid from "@/components/CollectionGrid";
import type { GameCardProps } from "@/components/GameCard";
import GameCollectionModal from "@/components/GameCollectionModal";

interface FeaturedGamesSectionProps {
  games: GameCardProps[];
}

export default function FeaturedGamesSection({
  games,
}: FeaturedGamesSectionProps) {
  const [activeGame, setActiveGame] = useState<GameCardProps | null>(null);

  return (
    <>
      <CollectionGrid games={games} onCardClick={(game) => setActiveGame(game)} />
      <GameCollectionModal game={activeGame} onClose={() => setActiveGame(null)} />
    </>
  );
}
