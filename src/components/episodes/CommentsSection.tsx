import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Flag,
  User as UserIcon,
  LogIn,
  CheckCircle2,
  CornerDownRight,
} from 'lucide-react';
import { Comment } from '../../types';
import {
  subscribeEpisodeComments,
  addComment,
  deleteComment,
  reportComment,
} from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';

interface CommentsSectionProps {
  episodeId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ episodeId }) => {
  const { currentUser, isGoogle, isGuest, isAdmin, signInWithGoogle } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState<boolean>(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = subscribeEpisodeComments(episodeId, (items) => {
      setComments(items);
    });
    return () => unsub();
  }, [episodeId]);

  const handlePostComment = async (parentId?: string, customText?: string) => {
    const textToSubmit = customText !== undefined ? customText : newCommentText;
    if (!textToSubmit.trim()) return;

    // Guest enforcement
    if (!currentUser || isGuest) {
      setShowGooglePrompt(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment({
        episodeId,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Cartoon Fan',
        userAvatar: currentUser.photoURL || undefined,
        text: textToSubmit.trim(),
        parentId: parentId || null,
      });

      if (parentId) {
        setReplyingTo(null);
        setReplyText('');
      } else {
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleReport = async (commentId: string) => {
    try {
      await reportComment(commentId);
      setReportedIds((prev) => new Set(prev).add(commentId));
    } catch (err) {
      console.error('Failed to report comment:', err);
    }
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-6 pt-4">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Comments & Fan Discussions ({comments.length})
        </h3>
      </div>

      {/* GUEST SIGN-IN PROMPT MODAL */}
      {showGooglePrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
              <LogIn className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Join the Classroom Conversation!</h4>
              <p className="text-sm text-slate-300 mt-2">
                Sign in with Google to join the conversation and share your thoughts!
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowGooglePrompt(false);
                  await signInWithGoogle();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-transform active:scale-95 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENT INPUT BOX */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 overflow-hidden">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <textarea
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={
                isGoogle
                  ? 'Share your thoughts on this episode...'
                  : 'Sign in with Google to write a comment...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                {isGoogle
                  ? 'Posting as ' + (currentUser?.displayName || 'Google User')
                  : 'Guest preview mode • Sign in with Google to post'}
              </p>

              <button
                type="button"
                onClick={() => handlePostComment()}
                disabled={isSubmitting || !newCommentText.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMMENTS LIST */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Be the first schoolmate to comment on this episode!
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isOwner = currentUser?.uid === comment.userId;
            const canDelete = isOwner || isAdmin;
            const isReported = comment.reported || reportedIds.has(comment.id);

            return (
              <div
                key={comment.id}
                className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {comment.userName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleReport(comment.id)}
                      disabled={isReported}
                      className={`p-1 transition-colors ${
                        isReported
                          ? 'text-amber-500'
                          : 'text-slate-400 hover:text-amber-400'
                      }`}
                      title="Report comment"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed pl-11">
                  {comment.text}
                </p>

                {/* Reply button */}
                <div className="pl-11 flex items-center gap-3 text-xs">
                  <button
                    onClick={() => {
                      if (!isGoogle) {
                        setShowGooglePrompt(true);
                      } else {
                        setReplyingTo(replyingTo?.id === comment.id ? null : comment);
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <CornerDownRight className="w-3 h-3" /> Reply
                  </button>
                </div>

                {/* Reply Input Box */}
                {replyingTo?.id === comment.id && (
                  <div className="pl-11 pt-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.userName}...`}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handlePostComment(comment.id, replyText)}
                        disabled={!replyText.trim() || isSubmitting}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-11 pt-2 space-y-2">
                    {replies.map((reply) => {
                      const isReplyOwner = currentUser?.uid === reply.userId;
                      const canDeleteReply = isReplyOwner || isAdmin;
                      return (
                        <div
                          key={reply.id}
                          className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300">
                              {reply.userName}
                            </span>
                            {canDeleteReply && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                className="text-slate-400 hover:text-rose-400 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-300">{reply.text}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
