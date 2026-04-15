import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, MessageCircle } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    location: string;
    approximate_time: string | null;
    description: string;
    is_resolved: boolean;
    created_at: string;
  };
  userId: string | undefined;
  userChatPostIds?: string[];
  onClaim: (post: any) => void;
  onRemove: (postId: string) => void;
  onViewClaims: (post: any) => void;
  onOpenChat: (postId: string) => void;
}

const PostCard = ({ post, userId, userChatPostIds = [], onClaim, onRemove, onViewClaims, onOpenChat }: PostCardProps) => {
  const isOwner = post.user_id === userId;
  const isLost = post.type === "lost";
  const hasChat = userChatPostIds.includes(post.id);

  return (
    <Card className="group relative border-0 bg-card/80 backdrop-blur-xl shadow-sm rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Decorative gradient border */}
      <div className="absolute inset-0 rounded-3xl p-[1px] pointer-events-none">
        <div className={`h-full w-full rounded-3xl ${
          post.is_resolved
            ? "bg-gradient-to-br from-primary/30 via-transparent to-primary/15"
            : isLost
            ? "bg-gradient-to-br from-destructive/25 via-transparent to-destructive/10"
            : "bg-gradient-to-br from-primary/25 via-transparent to-primary/10"
        }`} />
      </div>
      {/* Top accent strip */}
      <div className={`h-1 ${
        post.is_resolved
          ? "bg-gradient-to-r from-primary via-primary/60 to-transparent"
          : isLost
          ? "bg-gradient-to-r from-destructive via-destructive/60 to-transparent"
          : "bg-gradient-to-r from-primary via-primary/60 to-transparent"
      }`} />
      {/* Decorative blob */}
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${
        isLost ? "bg-destructive/8" : "bg-primary/8"
      }`} />

      <CardHeader className="relative pb-2 px-5 pt-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 flex-shrink-0 rounded-2xl flex items-center justify-center shadow-sm ${
            post.is_resolved
              ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
              : isLost
              ? "bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20"
              : "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
          }`}>
            <span className="text-base">{post.is_resolved ? "🤝" : isLost ? "😟" : "😊"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className={`text-[0.6rem] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                post.is_resolved
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : isLost
                  ? "bg-destructive/10 border-destructive/25 text-destructive"
                  : "bg-primary/10 border-primary/25 text-primary"
              }`}>
                {post.is_resolved ? "REUNITED 🎉" : isLost ? "LOST" : "FOUND"}
              </Badge>
            </div>
            <CardTitle className="text-sm sm:text-[0.95rem] font-bold text-foreground truncate leading-tight">{post.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3.5 text-xs px-5 pb-5">
        <p className="text-muted-foreground text-[0.8rem] leading-relaxed line-clamp-3">{post.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 border border-accent-foreground/10 px-3 py-1.5 text-[0.7rem] font-medium text-accent-foreground shadow-sm">
            <MapPin className="h-3 w-3" /> {post.location}
          </span>
          {post.approximate_time && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/8 border border-primary/12 px-3 py-1.5 text-[0.7rem] font-medium text-primary shadow-sm">
              <Clock className="h-3 w-3" /> {post.approximate_time}
            </span>
          )}
        </div>

        {!post.is_resolved && (
          <div className="flex flex-wrap gap-2 pt-1">
            {!isOwner && !hasChat && (
              <Button
                type="button"
                size="sm"
                className={`h-8 rounded-xl text-[0.7rem] px-4 font-semibold shadow-sm transition-all duration-200 hover:shadow-md ${
                  isLost
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70"
                    : "bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/70"
                }`}
                onClick={() => onClaim(post)}
              >
                {isLost ? "🔍 I found this item" : "🙋 I think this is mine"}
              </Button>
            )}
            {!isOwner && hasChat && (
              <Button type="button" size="sm" className="h-8 rounded-xl text-[0.7rem] px-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" onClick={() => onOpenChat(post.id)}>
                <MessageCircle className="h-3 w-3 mr-1" /> Open Chat
              </Button>
            )}
            {isOwner && (
              <>
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl text-[0.7rem] px-3 border-primary/20" onClick={() => onViewClaims(post)}>
                  <MessageCircle className="h-3 w-3 mr-1" /> View Claims
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-8 rounded-xl text-[0.7rem] px-3 text-destructive/70 hover:text-destructive hover:bg-destructive/8" onClick={() => onRemove(post.id)}>
                  Remove
                </Button>
              </>
            )}
          </div>
        )}
        {post.is_resolved && hasChat && (
          <div className="pt-1">
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-xl text-[0.7rem] px-3 border-primary/20 text-primary" onClick={() => onOpenChat(post.id)}>
              <MessageCircle className="h-3 w-3 mr-1" /> View Chat
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;
