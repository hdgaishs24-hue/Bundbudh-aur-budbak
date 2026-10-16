import React, { useState, useEffect } from 'react';
import { Heart, Laugh, Flame, Sparkles, ThumbsUp } from 'lucide-react';
import { Reaction, ReactionType } from '../../types';
import { subscribeEpisodeReactions, setReaction } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

interface ReactionsBarProps {
  episodeId: string;
}

const REACTION_CONFIG: { type: ReactionType; label: string; icon: string; color: string }[] = [
  { type: 'love', label: 'Love', icon: '❤️', color: 'hover:border-rose-500 hover:bg-rose-500/10 text-rose-400' },
  { type: 'funny', label: 'Funny', icon: '😂', color: 'hover:border-amber-500 hover:bg-amber-500/10 text-amber-400' },
  { type: 'amazing', label: 'Amazing', icon: '🔥', color: 'hover:border-orange-500 hover:bg-orange-500/10 text-orange-400' },
  { type: 'surprised', label: 'Surprised', icon: '😮', color: 'hover:border-purple-500 hover:bg-purple-500/10 text-purple-400' },
  { type: 'like', label: 'Like', icon: '👍', color: 'hover:border-blue-500 hover:bg-blue-500/10 text-blue-400' },
];

export const ReactionsBar: React.FC<ReactionsBarProps> = ({ episodeId }) => {
  const { currentUser, signInAsGuest } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeEpisodeReactions(episodeId, (items) => {
      setReactions(items);
      if (currentUser) {
        const found = items.find((r) => r.userId === currentUser.uid);
        setMyReaction(found ? found.reactionType : null);
      } else {
        setMyReaction(null);
      }
    });

    return () => unsub();
  }, [episodeId, currentUser]);

  const handleToggle = async (type: ReactionType) => {
    let user = currentUser;
    if (!user) {
      // Auto sign in as guest so user can react smoothly
      try {
        await signInAsGuest();
      } catch {
        return;
      }
    }

    if (isUpdating || !currentUser) return;
    setIsUpdating(true);

    try {
      const nextType = myReaction === type ? null : type;
      setMyReaction(nextType);
      await setReaction(episodeId, currentUser.uid, nextType);
    } catch (err) {
      console.error('Failed to set reaction:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCount = (type: ReactionType) => {
    return reactions.filter((r) => r.reactionType === type).length;
  };

  return (
    <div className="flex items-center flex-wrap gap-2 py-3 border-y border-slate-800/80">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
        React to episode:
      </span>

      <div className="flex items-center flex-wrap gap-2">
        {REACTION_CONFIG.map(({ type, label, icon, color }) => {
          const active = myReaction === type;
          const count = getCount(type);

          return (
            <button
              key={type}
              onClick={() => handleToggle(type)}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                active
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                  : `bg-slate-900 border-slate-800 text-slate-300 ${color}`
              }`}
            >
              <span className="text-sm">{icon}</span>
              <span className="capitalize">{label}</span>
              {count > 0 && (
                <span className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${active ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
